import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Server, Socket } from 'socket.io';
import { Companion } from './companion.entity';
import { Activity } from '../activity/activity.entity';
import { FLOW_STEP_MAP, FIRST_STEP_ID } from './flow.config';
import {
  FLOW_EVENTS,
  COMPANION_EVENTS,
  ScreenId,
  FlowStateUpdate,
  CompanionConfig,
  RegisterScreenPayload,
  NameSubmittedPayload,
  ChoiceSelectedPayload,
  createIdleFlowStateUpdate,
} from '@ba-praktisch/shared-types';

interface FlowSession {
  companionId: string;
  companionConfig: CompanionConfig;
  companionName: string | null;
  userName?: string | null;
  companionCreatedAt: string;
  currentStepId: string;
  moreInfoVisited: boolean;
  activityEffortScore?: number | null;
  activityDistanceMeters?: number | null;
  activityDurationSeconds?: number | null;
}

@WebSocketGateway({ cors: { origin: '*' } })
export class CompanionGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(CompanionGateway.name);

  constructor(
    @InjectRepository(Companion)
    private readonly companionRepository: Repository<Companion>,
    @InjectRepository(Activity)
    private readonly activityRepository: Repository<Activity>,
  ) {}

  private readonly screenRegistry = new Map<string, ScreenId>();
  private session: FlowSession | null = null;
  private resetTimer: NodeJS.Timeout | null = null;
  private activityLoadingTimer: NodeJS.Timeout | null = null;

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    this.screenRegistry.delete(client.id);
  }

  getActiveCompanionId(): string | null {
    return this.session?.companionId ?? null;
  }

  broadcastNewCompanion(companion: Companion): void {
    this.server.emit(COMPANION_EVENTS.CREATED, companion);
  }

  broadcastDeletedCompanion(id: string): void {
    this.server.emit(COMPANION_EVENTS.DELETED, { id });
  }

  async refreshActivityForCompanion(companionId: string): Promise<void> {
    if (!this.session || this.session.companionId !== companionId) return;
    await this.refreshActivityEffortScore();

    if (this.session.currentStepId === 'activity_loading') {
      this.clearActivityLoadingTimer();
      const score = this.session.activityEffortScore;
      this.advanceTo(score ? 'store_energy' : 'no_activity_detected');
      return;
    }

    this.broadcastFlowState();
  }

  startFlowSession(companion: Companion): void {
    if (this.session) {
      this.logger.warn(
        `New session started while ${this.session.companionId} was still active — overriding.`,
      );
    }
    this.session = {
      companionId: companion.id,
      companionConfig: this.extractConfig(companion),
      companionName: null,
      companionCreatedAt: companion.createdAt.toISOString(),
      currentStepId: FIRST_STEP_ID,
      moreInfoVisited: false,
      activityEffortScore: null,
      activityDistanceMeters: null,
      activityDurationSeconds: null,
    };
    this.broadcastFlowState();
    this.startResetTimer();
  }

  @SubscribeMessage(FLOW_EVENTS.REGISTER)
  handleRegister(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: RegisterScreenPayload,
  ): void {
    this.screenRegistry.set(client.id, payload.screenId);
    this.logger.log(
      `Screen registered: ${payload.screenId} (socket ${client.id})`,
    );

    client.emit(
      FLOW_EVENTS.STATE_UPDATE,
      this.session ? this.buildStateUpdate() : createIdleFlowStateUpdate(),
    );
  }

  @SubscribeMessage(FLOW_EVENTS.NAME_SUBMITTED)
  async handleNameSubmitted(
    @MessageBody() payload: NameSubmittedPayload,
  ): Promise<void> {
    if (!this.session) return;
    const name = payload.name.trim();
    this.session.companionName = name;
    this.session.userName = payload.userName;

    await this.companionRepository.update(this.session.companionId, { name });

    const next = this.resolveTransition(FLOW_EVENTS.NAME_SUBMITTED);
    if (next !== undefined) this.advanceTo(next);
  }

  @SubscribeMessage(FLOW_EVENTS.CHOICE_SELECTED)
  async handleChoiceSelected(
    @MessageBody() payload: ChoiceSelectedPayload,
  ): Promise<void> {
    if (!this.session) return;
    if (
      this.session.currentStepId === 'activity_started' &&
      payload.choiceId === 'activity_finished'
    ) {
      await this.refreshActivityEffortScore();
      const score = this.session.activityEffortScore;
      if (score) {
        this.advanceTo('store_energy');
      } else {
        this.advanceTo('activity_loading');
        this.startActivityLoadingTimer();
      }
      return;
    }
    if (
      this.session.currentStepId === 'store_energy_2' &&
      payload.choiceId === 'store_energy_3'
    ) {
      await this.refreshActivityEffortScore();
      this.server.emit(FLOW_EVENTS.ACTIVITY_UPDATED, {
        companionId: this.session.companionId,
      });
    }
    const next = this.resolveTransition(
      FLOW_EVENTS.CHOICE_SELECTED,
      payload.choiceId,
    );
    if (next !== undefined) this.advanceTo(next);
  }

  @SubscribeMessage(FLOW_EVENTS.ACTION_CONFIRMED)
  handleActionConfirmed(): void {
    if (!this.session) return;
    const next = this.resolveTransition(FLOW_EVENTS.ACTION_CONFIRMED);
    if (next !== undefined) this.advanceTo(next);
  }

  @SubscribeMessage(FLOW_EVENTS.EXIT_COMPLETE)
  handleExitComplete(): void {
    if (!this.session) return;
    const next = this.resolveTransition(FLOW_EVENTS.EXIT_COMPLETE);
    if (next !== undefined) this.advanceTo(next);
  }

  @SubscribeMessage(FLOW_EVENTS.RESET)
  async handleReset(): Promise<void> {
    await this.resetSession();
  }

  private advanceTo(nextStepId: string | null): void {
    if (nextStepId === null) {
      this.endSession();
      return;
    }
    if (!this.session) return;
    if (this.session.currentStepId === 'moreInfo') {
      this.session.moreInfoVisited = true;
    }
    this.session.currentStepId = nextStepId;
    this.broadcastFlowState();
    this.startResetTimer();
  }

  private startActivityLoadingTimer(): void {
    this.activityLoadingTimer = setTimeout(() => {
      if (this.session?.currentStepId === 'activity_loading') {
        this.advanceTo('no_activity_detected');
      }
      this.activityLoadingTimer = null;
    }, 15_000);
  }

  private clearActivityLoadingTimer(): void {
    if (this.activityLoadingTimer) {
      clearTimeout(this.activityLoadingTimer);
      this.activityLoadingTimer = null;
    }
  }

  private endSession(): void {
    if (!this.session) return;
    this.clearResetTimer();
    this.clearActivityLoadingTimer();

    this.server.emit(FLOW_EVENTS.COMPANION_ENTERED_HUB, {
      id: this.session.companionId,
      name: this.session.companionName ?? 'My Companion',
      createdAt: this.session.companionCreatedAt,
      ...this.session.companionConfig,
    });

    this.session = null;
    this.server.emit(FLOW_EVENTS.STATE_UPDATE, createIdleFlowStateUpdate());
  }

  private async resetSession(): Promise<void> {
    if (!this.session) return;
    this.clearResetTimer();
    this.clearActivityLoadingTimer();

    await this.companionRepository.delete(this.session.companionId);

    this.session = null;
    this.server.emit(FLOW_EVENTS.STATE_UPDATE, createIdleFlowStateUpdate());
  }

  private startResetTimer(): void {
    this.clearResetTimer();
    this.resetTimer = setTimeout(
      () => {
        this.logger.warn(
          'Flow session timed out after 10 minutes — resetting.',
        );
        this.resetSession();
      },
      10 * 60 * 1000,
    );
  }

  private clearResetTimer(): void {
    if (this.resetTimer) {
      clearTimeout(this.resetTimer);
      this.resetTimer = null;
    }
  }

  private broadcastFlowState(): void {
    this.server.emit(FLOW_EVENTS.STATE_UPDATE, this.buildStateUpdate());
  }

  private buildStateUpdate(): FlowStateUpdate {
    if (!this.session) return createIdleFlowStateUpdate();
    const step = FLOW_STEP_MAP.get(this.session.currentStepId);
    if (!step) return createIdleFlowStateUpdate();

    const replace = (text: string) =>
      text
        .replace(/\[companionName\]/g, this.session?.companionName ?? '')
        .replace(/\[userName\]/g, this.session?.userName ?? '')
        .replace(/\[effortScore\]/g, this.formatEffortScore())
        .replace(/\[activityDistance\]/g, this.formatActivityDistance())
        .replace(/\[activityDuration\]/g, this.formatActivityDuration());

    const session = this.session;
    const rawDialogue = (() => {
      if (step.id === 'moreInfo' && session.moreInfoVisited)
        return 'Was möchtest du sonst noch erfahren?';
      if (step.id === 'activity_finished') {
        const score = session.activityEffortScore ?? 0;
        return score >= 0.5
          ? 'Wow, du warst ja richtig fleissig! Du hast [effortScore] von 1000 Energie gesammelt und hast eine Distanz von [activityDistance] innerhalb [activityDuration] zurückgelegt.'
          : 'Gut gemacht! Du hast [effortScore] von 1000 Energie gesammelt und [activityDistance] in [activityDuration] zurückgelegt. Jedes bisschen zählt!';
      }
      return step.companionDialogue;
    })();
    const dialogue = rawDialogue ? replace(rawDialogue) : '';

    const creatorView = {
      ...step.creatorView,
      prompt: step.creatorView.prompt?.map(replace),
      title: step.creatorView.title?.map(replace),
      choices: step.creatorView.choices?.map((c) => ({
        ...c,
        label: replace(c.label),
      })),
    };

    return {
      stepId: this.session.currentStepId,
      companionId: this.session.companionId,
      companionConfig: this.session.companionConfig,
      companionName: this.session.companionName,
      companionDialogue: dialogue,
      creatorView,
      activityEffortScore: this.session.activityEffortScore ?? null,
    };
  }

  private async refreshActivityEffortScore(): Promise<void> {
    if (!this.session) return;
    const latest = await this.activityRepository.findOne({
      where: { companion: { id: this.session.companionId } },
      order: { startedAt: 'DESC' },
    });
    this.session.activityEffortScore = latest?.effortScore ?? null;
    this.session.activityDistanceMeters = latest?.distanceMeters ?? null;
    this.session.activityDurationSeconds = latest?.durationSeconds ?? null;
  }

  private formatEffortScore(): string {
    if (!this.session?.activityEffortScore) return '0';
    return Math.round(this.session.activityEffortScore * 1000).toString();
  }

  private formatActivityDistance(): string {
    const meters = this.session?.activityDistanceMeters;
    if (!meters || meters <= 0) return '0 m';
    if (meters < 1000) return `${Math.round(meters)} m`;
    const km = meters / 1000;
    return `${km.toFixed(1).replace('.', ',')} km`;
  }

  private formatActivityDuration(): string {
    const seconds = this.session?.activityDurationSeconds;
    if (!seconds || seconds <= 0) return '0 s';
    const totalSeconds = Math.max(0, Math.round(seconds));
    const minutes = Math.floor(totalSeconds / 60);
    const remainingSeconds = totalSeconds % 60;
    if (minutes === 0) return `${totalSeconds} s`;
    const paddedSeconds = String(remainingSeconds).padStart(2, '0');
    return `${minutes}:${paddedSeconds} min`;
  }

  private resolveTransition(
    eventName: string,
    choiceId?: string,
  ): string | null | undefined {
    if (!this.session) return undefined;
    const step = FLOW_STEP_MAP.get(this.session.currentStepId);
    if (!step) return undefined;

    const transition = step.transitions[eventName];
    if (transition === undefined) return undefined;
    if (transition === null) return null;
    if (typeof transition === 'string') return transition;

    return choiceId !== undefined
      ? (transition[choiceId] ?? undefined)
      : undefined;
  }

  private extractConfig(companion: Companion): CompanionConfig {
    return {
      furColor: companion.furColor,
      eyeColor: companion.eyeColor,
      noseColor: companion.noseColor,
      clothingTop: companion.clothingTop,
      clothingBottom: companion.clothingBottom,
      ears: companion.ears,
      tail: companion.tail,
      backpack: companion.backpack,
      bodyMorphs: companion.bodyMorphs,
    };
  }
}
