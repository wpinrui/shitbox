import type { CarListing, ConditionRating } from '@engine/types';
import { getCarDefinition, getConditionRating } from '@engine/index';
import './BrowseResultsModal.css';

interface BrowseResultsModalProps {
  listings: CarListing[];
  currentDay: number;
  onNegotiate: (listingId: string) => void;
  onClose: () => void;
}

const RATING_LABELS: Record<ConditionRating, string> = {
  excellent: 'Excellent',
  good: 'Good',
  fair: 'Fair',
  poor: 'Poor',
  scrap: 'Broken',
};

function badgeClass(rating: ConditionRating): string {
  if (rating === 'excellent' || rating === 'good') return 'good';
  if (rating === 'fair') return 'fair';
  return 'poor';
}

export function BrowseResultsModal({ listings, currentDay, onNegotiate, onClose }: BrowseResultsModalProps) {
  return (
    <div className="browse-backdrop" onClick={onClose}>
      <div className="browse-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="browse-modal__header">
          <span className="browse-modal__title">Junkers at the Scrapyard</span>
          <span className="browse-modal__sub">Day {currentDay}</span>
        </div>

        {/* Content */}
        <div className="browse-modal__content">
          {listings.map((listing) => {
            const carDef = getCarDefinition(listing.carId);
            if (!carDef) return null;
            const name = `${carDef.year} ${carDef.make} ${carDef.model}`;
            const hasImage = carDef.imageUrl !== '';
            const engineRating = getConditionRating(listing.condition.engine);
            const bodyRating = getConditionRating(listing.condition.body);

            return (
              <div key={listing.id} className="listing-card">
                {/* Image */}
                <div className="listing-card__image">
                  {hasImage ? (
                    <>
                      <div
                        className="listing-card__image-bg"
                        style={{ backgroundImage: `url('${carDef.imageUrl}')` }}
                      />
                      <div className="listing-card__image-fade" />
                    </>
                  ) : (
                    <>
                      <div className="listing-card__image-fade" />
                      <div className="listing-card__image-placeholder">No image</div>
                    </>
                  )}
                </div>

                {/* Info */}
                <div className="listing-card__info">
                  <div className="listing-card__name">{name}</div>
                  <div className="listing-card__badges">
                    <span className={`listing-badge listing-badge--${badgeClass(engineRating)}`}>
                      Engine {'\u00B7'} {RATING_LABELS[engineRating]}
                    </span>
                    <span className={`listing-badge listing-badge--${badgeClass(bodyRating)}`}>
                      Body {'\u00B7'} {RATING_LABELS[bodyRating]}
                    </span>
                  </div>
                  <div className="listing-card__footer">
                    <span className="listing-card__expires">
                      {listing.expiresDay <= currentDay + 1 ? 'Expires tomorrow' : `Expires day ${listing.expiresDay}`}
                    </span>
                    <div className="listing-card__price-wrap">
                      <span className="listing-card__price-label">Asking</span>
                      <span className="listing-card__price">${listing.askingPrice}</span>
                    </div>
                  </div>
                  <button
                    className="btn-primary listing-card__negotiate"
                    onClick={() => onNegotiate(listing.id)}
                  >
                    Negotiate
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="browse-modal__footer">
          <div className="browse-modal__note">
            These listings are held until tomorrow. Come back with cash to negotiate.
          </div>
          <button className="browse-modal__close" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
