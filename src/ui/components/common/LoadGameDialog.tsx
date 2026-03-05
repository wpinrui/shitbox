import { useEffect, useState, useCallback } from 'react';
import type { GameState } from '@engine/index';

interface SaveInfo {
  saveId: string;
  playerName: string;
  day: number;
  lastSavedAt: number;
  lastSavedDisplay: string;
}

interface LoadGameDialogProps {
  onLoad: (saveId: string) => void;
  onBack: () => void;
}

export function LoadGameDialog({ onLoad, onBack }: LoadGameDialogProps) {
  const [saves, setSaves] = useState<SaveInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const fetchSaves = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const saveIds = await window.electronAPI.listSaves();
      const saveInfos: SaveInfo[] = [];

      for (const saveId of saveIds) {
        try {
          const data = await window.electronAPI.loadGame(saveId);
          const gameState = data as GameState;
          saveInfos.push({
            saveId,
            playerName: gameState.player.name,
            day: gameState.time.currentDay,
            lastSavedAt: gameState.meta.lastSavedAt,
            lastSavedDisplay: new Date(gameState.meta.lastSavedAt).toLocaleString(),
          });
        } catch {
          // Skip corrupted saves
        }
      }

      saveInfos.sort((a, b) => b.lastSavedAt - a.lastSavedAt);
      setSaves(saveInfos);
    } catch {
      setError('Failed to load save files.');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchSaves();
  }, [fetchSaves]);

  const handleDelete = async (saveId: string) => {
    try {
      await window.electronAPI.deleteSave(saveId);
      setSaves((prev) => prev.filter((s) => s.saveId !== saveId));
      setDeleteConfirm(null);
    } catch {
      setError('Failed to delete save.');
    }
  };

  return (
    <div className="confirm-dialog-overlay">
      <div className="load-game-dialog">
        <h3>Load Game</h3>

        {loading && <p className="load-game-status">Loading saves...</p>}
        {error && <p className="load-game-error">{error}</p>}

        {!loading && saves.length === 0 && (
          <p className="load-game-status">No save files found.</p>
        )}

        {!loading && saves.length > 0 && (
          <div className="save-list">
            {saves.map((save) => (
              <div key={save.saveId} className="save-item">
                {deleteConfirm === save.saveId ? (
                  <div className="save-delete-confirm">
                    <span>Delete this save?</span>
                    <div className="save-delete-buttons">
                      <button onClick={() => handleDelete(save.saveId)}>Yes</button>
                      <button onClick={() => setDeleteConfirm(null)}>No</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <button className="save-item-main" onClick={() => onLoad(save.saveId)}>
                      <span className="save-name">{save.playerName}</span>
                      <span className="save-details">Day {save.day} | {save.lastSavedDisplay}</span>
                    </button>
                    <button
                      className="save-item-delete"
                      onClick={() => setDeleteConfirm(save.saveId)}
                      title="Delete save"
                    >
                      X
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="confirm-dialog-buttons">
          <button className="confirm-dialog-cancel" onClick={onBack}>
            Back
          </button>
        </div>
      </div>
    </div>
  );
}
