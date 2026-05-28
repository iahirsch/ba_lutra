import { useState, useEffect, useRef, type SubmitEvent } from 'react';
import type { FlowStateUpdate } from '@ba-praktisch/shared-types';
import styles from './EditorFlowPanel.module.scss';

function NameInputView({
  title,
  prompt,
  onSubmitName,
}: {
  title?: string[];
  prompt?: string[];
  onSubmitName: (lutraName: string, userName: string) => void;
}) {
  const [lutraValue, setLutraValue] = useState('');
  const [userValue, setUserValue] = useState('');
  const inputRefLutra = useRef<HTMLInputElement>(null);
  const inputRefUser = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRefLutra.current?.focus();
  }, []);

  function handleSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmedLutra = lutraValue.trim();
    const trimmedUser = userValue.trim();
    if (!trimmedLutra || !trimmedUser) return;
    onSubmitName(trimmedLutra, trimmedUser);
  }

  return (
    <form onSubmit={handleSubmit} className={styles.view}>
      <div className={styles.header}>Lutra erstellen</div>
      <div className={styles.viewContainer}>
        <div className={styles.formularField}>
          {title && <h2 className={styles.title}>{title[0]}</h2>}
          {prompt && <p className={styles.prompt}>{prompt[0]}</p>}
          <input
            ref={inputRefLutra}
            type="text"
            className={`${styles.textfield} ${lutraValue.trim() ? 'input--valid' : ''}`}
            value={lutraValue}
            onChange={(e) => setLutraValue(e.target.value)}
            placeholder="Trage einen Namen ein"
            maxLength={30}
            autoComplete="off"
            autoCapitalize="words"
            autoCorrect="off"
            spellCheck={false}
            aria-label="Companion name"
          />
        </div>
        <div className={styles.formularField}>
          {title && <h2 className={styles.title}>{title[1]}</h2>}
          {prompt && <p className={styles.prompt}>{prompt[1]}</p>}
          <input
            ref={inputRefUser}
            type="text"
            className={`${styles.textfield} ${userValue.trim() ? 'input--valid' : ''}`}
            value={userValue}
            onChange={(e) => setUserValue(e.target.value)}
            placeholder="Trage deinen Spitznamen ein"
            maxLength={30}
            autoComplete="off"
            autoCapitalize="words"
            autoCorrect="off"
            spellCheck={false}
            aria-label="Companion name"
          />
        </div>
      </div>

      <button
        type="submit"
        className={styles.actionButton}
        disabled={!lutraValue.trim() || !userValue.trim()}
      >
        Erstellen
      </button>
    </form>
  );
}

function ChoicesView({
  title,
  prompt,
  choices,
  onSelectChoice,
}: {
  title?: string[];
  prompt?: string[];
  choices: { id: string; label: string }[];
  onSelectChoice: (id: string) => void;
}) {
  return (
    <div className={styles.view}>
      <div className={styles.viewContainer}>
        {title && <h2 className={styles.title}>{title}</h2>}
        {prompt && <p className={styles.prompt}>{prompt}</p>}
        <div className={styles.choiceList}>
          {choices.map((choice) => (
            <button
              key={choice.id}
              className={styles.actionButton}
              onClick={() => onSelectChoice(choice.id)}
            >
              {choice.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function ConfirmView({
  title,
  prompt,
  confirmLabel,
  onConfirmAction,
}: {
  title?: string[];
  prompt?: string[];
  confirmLabel?: string;
  onConfirmAction: () => void;
}) {
  return (
    <div className={styles.view}>
      {title && <h2 className={styles.title}>{title}</h2>}
      {prompt && <p className={styles.prompt}>{prompt}</p>}
      <button className={styles.actionButton} onClick={onConfirmAction}>
        {confirmLabel ?? 'Continue'}
      </button>
    </div>
  );
}

function TransitionView({
  prompt,
  onExitComplete,
}: {
  prompt?: string[];
  onExitComplete: () => void;
}) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onExitComplete();
    }, 3000); // 3 Sekunden anzeigen, dann weiter
    return () => clearTimeout(timer);
  }, [onExitComplete]);

  return (
    <div className={styles.view}>
      {prompt && <p className={styles.prompt}>{prompt.join(' ')}</p>}
      <div className={styles.dots} aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
    </div>
  );
}

interface EditorFlowPanelProps {
  flowState: FlowStateUpdate;
  onSubmitName: (name: string) => void;
  onSelectChoice: (choiceId: string) => void;
  onConfirmAction: () => void;
  onResetFlow: () => void;
  onExitComplete: () => void;
}

export function EditorFlowPanel({
  flowState,
  onSubmitName,
  onSelectChoice,
  onConfirmAction,
  onResetFlow,
  onExitComplete,
}: EditorFlowPanelProps) {
  const { type, title, prompt, choices, confirmLabel } = flowState.creatorView;

  return (
    <div className={styles.panel}>
      <button
        className={styles.resetButton}
        onClick={onResetFlow}
        aria-label="Reset"
      >
        ✕
      </button>
      <div className={styles.overlay}>
        <div className={styles.content} key={flowState.stepId}>
          {type === 'name-input' && (
            <NameInputView
              title={title}
              prompt={prompt}
              onSubmitName={onSubmitName}
            />
          )}

          {type === 'choices' && choices && (
            <ChoicesView
              title={title}
              prompt={prompt}
              choices={choices}
              onSelectChoice={onSelectChoice}
            />
          )}

          {type === 'confirm' && (
            <ConfirmView
              title={title}
              prompt={prompt}
              confirmLabel={confirmLabel}
              onConfirmAction={onConfirmAction}
            />
          )}

          {type === 'transition' && (
            <TransitionView prompt={prompt} onExitComplete={onExitComplete} />
          )}
        </div>
      </div>
    </div>
  );
}
