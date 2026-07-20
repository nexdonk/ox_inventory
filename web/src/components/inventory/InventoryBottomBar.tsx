import React from 'react';
import { LuInfo } from 'react-icons/lu';

interface Props {
  onInfo: () => void;
  onClose: () => void;
}

const InventoryBottomBar: React.FC<Props> = ({ onInfo, onClose }) => {
  return (
    <div className="inventory-bottom-bar">
      <button className="useful-controls-button" onClick={onInfo} aria-label="Useful controls">
        <LuInfo size={14} />
      </button>

      <button className="esc-close" type="button" onClick={onClose}>
        <span className="esc-close-text">Close Inventory</span>
        <kbd>ESC</kbd>
      </button>
    </div>
  );
};

export default InventoryBottomBar;
