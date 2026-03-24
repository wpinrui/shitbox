import { useState } from 'react';
import type { NegotiationState } from '@engine/types';
import { getCarDefinition } from '@engine/index';
import './NegotiationModal.css';

interface NegotiationModalProps {
  negotiation: NegotiationState;
  onSubmitOffer: (price: number) => void;
  onAcceptListPrice: () => void;
  onWalkAway: () => void;
}

export function NegotiationModal({
  negotiation,
  onSubmitOffer,
  onAcceptListPrice,
  onWalkAway,
}: NegotiationModalProps) {
  const [offerInput, setOfferInput] = useState('');

  const carDef = getCarDefinition(negotiation.item.carId);
  const carName = carDef ? `${carDef.year} ${carDef.make} ${carDef.model}` : 'Vehicle';

  const lastRound = negotiation.history[negotiation.history.length - 1];
  const lastCounterPrice = lastRound?.npcResponse.counterOffer?.price ?? negotiation.npc.targetPrice;
  const lastDialogue = lastRound?.npcResponse.dialogue ?? `"What'll it be?"`;
  const isOver = negotiation.status !== 'active';

  const handleSubmit = () => {
    const price = parseInt(offerInput, 10);
    if (!isNaN(price) && price > 0) {
      onSubmitOffer(price);
      setOfferInput('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSubmit();
  };

  return (
    <div className="neg-backdrop">
      <div className="neg-modal" onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="neg-modal__header">
          <div className="neg-modal__title">{carName}</div>
          <div className="neg-modal__npc">Seller: {negotiation.npc.name}</div>
          {negotiation.npc.revealedTraits.length > 0 && (
            <div className="neg-modal__traits">
              {negotiation.npc.revealedTraits.map((traitId) => (
                <span key={traitId} className="neg-trait-badge">{traitId}</span>
              ))}
            </div>
          )}
        </div>

        {/* Car info row */}
        <div className="neg-modal__info-row">
          <span className="neg-modal__info-label">Market value</span>
          <span className="neg-modal__info-value">${negotiation.item.marketValue.toLocaleString()}</span>
        </div>

        {/* NPC asking / counter */}
        <div className="neg-modal__price-row">
          <span className="neg-modal__price-label">
            {negotiation.history.length === 0 ? 'Asking price' : 'Their offer'}
          </span>
          <span className="neg-modal__price">${lastCounterPrice.toLocaleString()}</span>
        </div>

        {/* Dialogue */}
        <div className="neg-modal__dialogue">{lastDialogue}</div>

        {/* Offer input */}
        {!isOver && (
          <div className="neg-modal__offer-row">
            <span className="neg-modal__offer-prefix">$</span>
            <input
              className="neg-modal__offer-input"
              type="number"
              min={1}
              value={offerInput}
              onChange={(e) => setOfferInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Your offer"
              autoFocus
            />
            <button
              className="btn-primary"
              onClick={handleSubmit}
              disabled={!offerInput || isNaN(parseInt(offerInput, 10))}
            >
              Offer
            </button>
          </div>
        )}

        {/* Result message */}
        {isOver && (
          <div className={`neg-modal__result neg-modal__result--${negotiation.status}`}>
            {negotiation.status === 'accepted'
              ? `Deal! You paid $${(negotiation.acceptedPrice ?? 0).toLocaleString()}.`
              : `${negotiation.npc.name} walked away. No deal.`}
          </div>
        )}

        {/* Buttons */}
        <div className="neg-modal__buttons">
          {!isOver && (
            <>
              <button className="btn-secondary" onClick={onWalkAway}>Walk Away</button>
              <button className="btn-secondary" onClick={onAcceptListPrice}>
                Accept ${lastCounterPrice.toLocaleString()}
              </button>
            </>
          )}
          {isOver && (
            <button className="btn-primary" onClick={onWalkAway}>
              {negotiation.status === 'accepted' ? 'Done' : 'Leave'}
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
