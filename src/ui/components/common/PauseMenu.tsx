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
            <button className="confirm-dialog-cancel" onClick={() => setShowQuitConfirm(false)}>
              Cancel
            </button>
            <button className="confirm-dialog-confirm" onClick={onQuit}>
              Quit
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="confirm-dialog-overlay" onClick={onClose}>
      <div className="pause-menu" onClick={(e) => e.stopPropagation()}>
        <h3>Menu</h3>
        <div className="pause-menu-buttons">
          <button className="pause-menu-button" onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : saved ? 'Saved!' : 'Save Game'}
          </button>
          <button className="pause-menu-button" onClick={() => setShowLoad(true)}>
            Load Game
          </button>
          <button className="pause-menu-button" onClick={() => setShowQuitConfirm(true)}>
            Quit to Menu
          </button>
          <button className="pause-menu-button secondary" onClick={onClose}>
            Resume
          </button>
        </div>
      </div>
    </div>
  );
}
