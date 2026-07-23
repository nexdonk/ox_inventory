import React from 'react';
import { motion } from 'framer-motion';
import { LuShirt, LuLayoutGrid, LuUtensils, LuHeartPulse, LuCrosshair } from 'react-icons/lu';
import type { ItemFilter } from '../../utils/itemFilter';

interface Props {
  filter: ItemFilter;
  onFilterChange: (filter: ItemFilter) => void;
  clothingMode: boolean;
  onClothingToggle: () => void;
}

const FILTERS: { id: ItemFilter; icon: React.ReactNode; label: string }[] = [
  { id: 'all', icon: <LuLayoutGrid strokeWidth={2.2} />, label: 'All items' },
  { id: 'food', icon: <LuUtensils strokeWidth={2.2} />, label: 'Food' },
  { id: 'heal', icon: <LuHeartPulse strokeWidth={2.2} />, label: 'Heal' },
  { id: 'weapon', icon: <LuCrosshair strokeWidth={2.2} />, label: 'Weapons' },
];

const InventoryActions: React.FC<Props> = ({ filter, onFilterChange, clothingMode, onClothingToggle }) => {
  return (
    <div className="inv-actions">
      <motion.button
        type="button"
        whileTap={{ scale: 0.94 }}
        className={`inv-action-btn inv-action-btn--clothing${clothingMode ? ' is-active' : ''}`}
        onClick={onClothingToggle}
        aria-label="Clothing & Props"
        title="Clothing & Props"
      >
        <LuShirt strokeWidth={2.2} />
      </motion.button>

      <div className="inv-actions-divider" aria-hidden />

      {FILTERS.map((f) => (
        <motion.button
          key={f.id}
          type="button"
          whileTap={{ scale: 0.94 }}
          className={`inv-action-btn inv-action-btn--${f.id}${filter === f.id ? ' is-active' : ''}`}
          onClick={() => onFilterChange(f.id)}
          aria-label={f.label}
          title={f.label}
        >
          {f.icon}
        </motion.button>
      ))}
    </div>
  );
};

export default InventoryActions;
