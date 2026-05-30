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
  ) {}

  private readonly screenRegistry = new Map<string, ScreenId>();
  private session: FlowSession | null = null;
  private resetTimer: NodeJS.Timeout | null = null;

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
  handleChoiceSelected(@MessageBody() payload: ChoiceSelectedPayload): void {
    if (!this.session) return;
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

  private endSession(): void {
    if (!this.session) return;
    this.clearResetTimer();

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
        .replace(/\[companionName\]/g, this.session!.companionName ?? '')
        .replace(/\[userName\]/g, this.session!.userName ?? '');

    const rawDialogue =
      step.id === 'moreInfo' && this.session.moreInfoVisited
        ? 'Was möchtest du sonst noch erfahren?'
        : step.companionDialogue;
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
    };
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
