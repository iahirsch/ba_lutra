import { useEffect, useRef, useState, useCallback } from 'react';
import { type Socket } from 'socket.io-client';
import { createMainSocket } from '../utils/createMainSocket';
import {
  FLOW_EVENTS,
  SCREENS,
  ScreenId,
  FlowStateUpdate,
  RegisterScreenPayload,
  NameSubmittedPayload,
  ChoiceSelectedPayload,
} from '@ba-praktisch/shared-types';

export interface UseFlowSocketReturn {
  flowState: FlowStateUpdate | null;
  connected: boolean;
  submitName: (name: string) => void;
  selectChoice: (choiceId: string) => void;
  confirmAction: () => void;
  notifyExitComplete: () => void;
}

/**
 * Manages the WebSocket connection for the multi-screen interaction flow.
 *
 * Pass the screen's identity as `screenId` — the server uses this to know
 * which display it's talking to.
 *
 * @example
 *   const { flowState, submitName } = useFlowSocket(SCREENS.EDITOR);
 */
export function useFlowSocket(screenId: ScreenId): UseFlowSocketReturn {
  const [flowState, setFlowState] = useState<FlowStateUpdate | null>(null);
  const [connected, setConnected] = useState(false);

  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const socket = createMainSocket();
    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);

      const payload: RegisterScreenPayload = { screenId };
      socket.emit(FLOW_EVENTS.REGISTER, payload);
    });

    socket.on('disconnect', () => setConnected(false));

    socket.on(FLOW_EVENTS.STATE_UPDATE, (update: FlowStateUpdate) => {
      setFlowState(update.stepId === 'idle' ? null : update);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [screenId]);

  const submitName = useCallback((name: string) => {
    const payload: NameSubmittedPayload = { name };
    socketRef.current?.emit(FLOW_EVENTS.NAME_SUBMITTED, payload);
  }, []);

  const selectChoice = useCallback((choiceId: string) => {
    const payload: ChoiceSelectedPayload = { choiceId };
    socketRef.current?.emit(FLOW_EVENTS.CHOICE_SELECTED, payload);
  }, []);

  const confirmAction = useCallback(() => {
    socketRef.current?.emit(FLOW_EVENTS.ACTION_CONFIRMED);
  }, []);

  const notifyExitComplete = useCallback(() => {
    socketRef.current?.emit(FLOW_EVENTS.EXIT_COMPLETE);
  }, []);

  return {
    flowState,
    connected,
    submitName,
    selectChoice,
    confirmAction,
    notifyExitComplete,
  };
}

export { SCREENS };
