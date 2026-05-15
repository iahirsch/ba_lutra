import { useState, useEffect, useRef, type SubmitEvent } from 'react';
import type { FlowStateUpdate } from '@ba-praktisch/shared-types';
import styles from './EditorFlowPanel.module.scss';

function NameInputView({
  prompt,
  onSubmitName,
}: {
  prompt?: string;
  onSubmitName: (name: string) => void;
}) {
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  function handleSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) return;
    onSubmitName(trimmed);
  }

  return (
    <form onSubmit={handleSubmit} className={styles.view}>
      {prompt && <p className={styles.prompt}>{prompt}</p>}
      <input
        ref={inputRef}
        type="text"
        className={styles.nameInput}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Type a name…"
        maxLength={30}
        autoComplete="off"
        autoCapitalize="words"
        autoCorrect="off"
        spellCheck={false}
        aria-label="Companion name"
      />
      <button
        type="submit"
        className={styles.actionButton}
        disabled={!value.trim()}
      >
        Done
      </button>
    </form>
  );
}

function ChoicesView({
  prompt,
  choices,
  onSelectChoice,
}: {
  prompt?: string;
  choices: { id: string; label: string }[];
  onSelectChoice: (id: string) => void;
}) {
  return (
    <div className={styles.view}>
      {prompt && <p className={styles.prompt}>{prompt}</p>}
      <div className={styles.choiceList}>
        {choices.map((choice) => (
          <button
            key={choice.id}
            className={styles.choiceButton}
            onClick={() => onSelectChoice(choice.id)}
          >
            {choice.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function ConfirmView({
  prompt,
  confirmLabel,
  onConfirmAction,
}: {
  prompt?: string;
  confirmLabel?: string;
  onConfirmAction: () => void;
}) {
  return (
    <div className={styles.view}>
      {prompt && <p className={styles.prompt}>{prompt}</p>}
      <button className={styles.actionButton} onClick={onConfirmAction}>
        {confirmLabel ?? 'Continue'}
      </button>
    </div>
  );
}

function TransitionView({ prompt }: { prompt?: string }) {
  return (
    <div className={styles.view}>
      {prompt && <p className={styles.prompt}>{prompt}</p>}
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
}

export function EditorFlowPanel({
  flowState,
  onSubmitName,
  onSelectChoice,
  onConfirmAction,
}: EditorFlowPanelProps) {
  const { type, prompt, choices, confirmLabel } = flowState.creatorView;

  return (
    <div className={styles.panel}>
      <div className={styles.content} key={flowState.stepId}>
        {type === 'name-input' && (
          <NameInputView prompt={prompt} onSubmitName={onSubmitName} />
        )}

        {type === 'choices' && choices && (
          <ChoicesView
            prompt={prompt}
            choices={choices}
            onSelectChoice={onSelectChoice}
          />
        )}

        {type === 'confirm' && (
          <ConfirmView
            prompt={prompt}
            confirmLabel={confirmLabel}
            onConfirmAction={onConfirmAction}
          />
        )}

        {type === 'transition' && <TransitionView prompt={prompt} />}
      </div>
    </div>
  );
}
