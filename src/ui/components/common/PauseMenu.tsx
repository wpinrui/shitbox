import { useState } from 'react';
import { LoadGameDialog } from './LoadGameDialog';

interface PauseMenuProps {
  onSave: () => Promise<void>;
  onLoad: (saveId: string) => void;
  onQuit: () => void;
  onClose: () => void;
}

export function PauseMenu({ onSave, onLoad, onQuit, onClose }: PauseMenuProps) {
  const [showLoad, setShowLoad] = useState(false);
  const [showQuitConfirm, setShowQuitConfirm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setIsSaving(false);
    }
  };

  if (showLoad) {
    return (
      <LoadGameDialog
        onLoad={onLoad}
        onBack={() => setShowLoad(false)}
      />
    );
  }

  if (showQuitConfirm) {
    return (
      <div className="confirm-dialog-overlay">
        <div className="confirm-dialog">
          <h3>Quit to Menu?</h3>
          <p>Unsaved progress will be lost.</p>
          <div className="confirm-dialog-buttons">
            <button className="btn-secondary" onClick={() => setShowQuitConfirm(false)}>
              Cancel
            </button>
            <button className="btn-primary" onClick={onQuit}>
              Quit
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="confirm-dialog-overlay pause-overlay" onClick={onClose}>
      <div className="pause-menu" onClick={(e) => e.stopPropagation()}>
        <h3>Paused</h3>
        <div className="pause-menu-buttons">
          <button className="btn-primary" onClick={onClose}>
            Resume
          </button>
          <button className="btn-secondary" onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : saved ? 'Saved!' : 'Save Game'}
          </button>
          <button className="btn-secondary" onClick={() => setShowLoad(true)}>
            Load Game
          </button>
          <div className="pause-menu-divider" />
          <button className="btn-danger" onClick={() => setShowQuitConfirm(true)}>
            Quit to Menu
          </button>
        </div>
      </div>
    </div>
  );
}
