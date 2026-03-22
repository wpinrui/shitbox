import { useEffect } from 'react';
import type { NewspaperState, GigListing } from '@engine/index';
import './NewspaperModal.css';

interface NewspaperModalProps {
  newspaper: NewspaperState;
  currentDay: number;
  onTakeGig: (gigId: string) => { success: boolean; error?: string };
  onClose: () => void;
}

export function NewspaperModal({
  newspaper,
  currentDay,
  onTakeGig,
  onClose,
}: NewspaperModalProps) {
  const content = newspaper.content;

  // Close if newspaper state becomes stale (new day started while modal was open)
  useEffect(() => {
    if (!content || newspaper.currentDay !== currentDay) {
      onClose();
    }
  }, [content, newspaper.currentDay, currentDay, onClose]);

  if (!content) return null;

  const getGigState = (gig: GigListing): 'available' | 'taken' | 'expired' => {
    if (gig.taken) return 'taken';
    if (gig.day !== currentDay) return 'expired';
    return 'available';
  };

  return (
    <div className="newspaper-modal-overlay" onClick={onClose}>
      <div className="newspaper-modal" onClick={(e) => e.stopPropagation()}>

        {/* Masthead */}
        <div className="newspaper-masthead">
          <span className="newspaper-masthead__title">The Daily Shitbox</span>
          <span className="newspaper-masthead__date">Day {currentDay}</span>
        </div>

        {/* Scrollable content */}
        <div className="newspaper-content">

          {/* Headlines */}
          {content.headlines.length > 0 && (
            <>
              <div className="newspaper-section-label">Headlines</div>
              <div className="headlines">
                {content.headlines.map((headline, i) => (
                  <div key={i} className="headline">
                    <span className="headline__bullet">·</span>
                    <span className="headline__text">{headline}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Gigs */}
          {content.gigs.length > 0 && (
            <>
              <div className="newspaper-divider" />
              <div className="newspaper-section-label">Gigs — Available Today</div>
              <div className="gigs">
                {content.gigs.map((gig) => {
                  const gigState = getGigState(gig);
                  return (
                    <div key={gig.id} className="gig-card">
                      <div className="gig-card__name">{gig.title}</div>
                      <div className="gig-card__desc">{gig.description}</div>
                      <div className="gig-card__divider" />
                      <div className="gig-card__costs">
                        <div className="gig-card__cost">
                          <span className="gig-card__cost-icon">💰</span>
                          <span className="gig-card__cost-text gig-card__cost-text--earn">
                            +${gig.pay}
                          </span>
                        </div>
                        <div className="gig-card__cost">
                          <span className="gig-card__cost-icon">⏱</span>
                          <span className="gig-card__cost-text gig-card__cost-text--time">
                            {gig.timeCost} hr{gig.timeCost !== 1 ? 's' : ''}
                          </span>
                        </div>
                        <div className="gig-card__cost">
                          <span className="gig-card__cost-icon">⚡</span>
                          <span className="gig-card__cost-text gig-card__cost-text--energy">
                            {gig.energyPerHour}/hr
                          </span>
                        </div>
                      </div>
                      <button
                        className={`btn-gig${gigState === 'taken' ? ' btn-gig--taken' : gigState === 'expired' ? ' btn-gig--expired' : ''}`}
                        onClick={gigState === 'available' ? () => onTakeGig(gig.id) : undefined}
                        disabled={gigState !== 'available'}
                      >
                        {gigState === 'taken'
                          ? 'Already taken'
                          : gigState === 'expired'
                          ? 'Expired'
                          : 'Take the gig'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          <button className="newspaper-close btn-primary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
