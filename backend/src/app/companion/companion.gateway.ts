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
  ScreenId,
  FlowStateUpdate,
  CompanionConfig,
  RegisterScreenPayload,
  NameSubmittedPayload,
  ChoiceSelectedPayload,
} from '@ba-praktisch/shared-types';

// Active flow session
interface FlowSession {
  companionId: string;
  companionConfig: CompanionConfig;
  companionName: string | null;
  companionCreatedAt: string;
  currentStepId: string;
}

const IDLE_UPDATE: FlowStateUpdate = {
  stepId: 'idle',
  companionId: '',
  companionConfig: {
    fur: '',
    eyes: '',
    nose: '',
    clothing: '',
    ears: '',
    tail: '',
    backpack: '',
    bodyMorphs: {},
  },
  companionName: null,
  companionDialogue: '',
  creatorView: { type: 'idle' },
};

// Gateway
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

  /** Maps socket ID → registered screen ID */
  private readonly screenRegistry = new Map<string, ScreenId>();

  private session: FlowSession | null = null;

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    this.screenRegistry.delete(client.id);
  }

  broadcastNewCompanion(companion: Companion): void {
    this.server.emit('companion:created', companion);
  }

  broadcastDeletedCompanion(id: string): void {
    this.server.emit('companion:deleted', { id });
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
    };
    this.broadcastFlowState();
  }

  // Screen registration
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
      this.session ? this.buildStateUpdate() : IDLE_UPDATE,
    );
  }

  // Flow event handlers
  @SubscribeMessage(FLOW_EVENTS.NAME_SUBMITTED)
  async handleNameSubmitted(
    @MessageBody() payload: NameSubmittedPayload,
  ): Promise<void> {
    if (!this.session) return;
    const name = payload.name.trim();
    this.session.companionName = name;

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

  // Advance to the given step, or end the session if nextStepId is null.
  private advanceTo(nextStepId: string | null): void {
    if (nextStepId === null) {
      this.endSession();
      return;
    }
    if (!this.session) return;
    this.session.currentStepId = nextStepId;
    this.broadcastFlowState();
  }

  private endSession(): void {
    if (!this.session) return;

    this.server.emit(FLOW_EVENTS.COMPANION_ENTERED_HUB, {
      id: this.session.companionId,
      name: this.session.companionName ?? 'My Companion',
      createdAt: this.session.companionCreatedAt,
      ...this.session.companionConfig,
    });

    this.session = null;

    // Reset all screens to idle
    this.server.emit(FLOW_EVENTS.STATE_UPDATE, IDLE_UPDATE);
  }

  private broadcastFlowState(): void {
    this.server.emit(FLOW_EVENTS.STATE_UPDATE, this.buildStateUpdate());
  }

  private buildStateUpdate(): FlowStateUpdate {
    if (!this.session) return IDLE_UPDATE;
    const step = FLOW_STEP_MAP.get(this.session.currentStepId);
    if (!step) return IDLE_UPDATE;

    const dialogue = this.session.companionName
      ? step.companionDialogue.replace(/\[name\]/g, this.session.companionName)
      : step.companionDialogue;

    return {
      stepId: this.session.currentStepId,
      companionId: this.session.companionId,
      companionConfig: this.session.companionConfig,
      companionName: this.session.companionName,
      companionDialogue: dialogue,
      creatorView: step.creatorView,
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
      fur: companion.fur,
      eyes: companion.eyes,
      nose: companion.nose,
      clothing: companion.clothing,
      ears: companion.ears,
      tail: companion.tail,
      backpack: companion.backpack,
      bodyMorphs: companion.bodyMorphs,
    };
  }
}
