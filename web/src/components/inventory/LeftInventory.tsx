import React from 'react';
import InventoryGrid from './InventoryGrid';
import { useAppSelector } from '../../store';
import { selectLeftInventory } from '../../store/inventory';
import EmbeddedHotbar from './EmbeddedHotbar';
import SectionHeader from './SectionHeader';
import { motion } from 'framer-motion';
import { LuBoxes } from 'react-icons/lu';
import { getTotalWeight } from '../../helpers';
import type { ItemFilter } from '../../utils/itemFilter';

interface Props {
  filter: ItemFilter;
  onFilterChange: (f: ItemFilter) => void;
  clothingMode: boolean;
  onClothingToggle: () => void;
}

const LeftInventory: React.FC<Props> = ({ filter, onFilterChange, clothingMode, onClothingToggle }) => {
  const leftInventory = useAppSelector(selectLeftInventory);
  const weight =
    leftInventory.maxWeight !== undefined ? Math.floor(getTotalWeight(leftInventory.items) * 1000) / 1000 : 0;

  return (
    <motion.div
      className="inventory-side inventory-side--left"
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -16 }}
      transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
    >
      <SectionHeader
        icon={<LuBoxes size={14} />}
        tone="inventory"
        title="Inventory"
        subtitle="Your personal inventory is on the left."
        weight={leftInventory.maxWeight ? { current: weight, max: leftInventory.maxWeight } : undefined}
      />

      <InventoryGrid inventory={leftInventory} startIndex={5} hideHeader filter={filter} />

      <EmbeddedHotbar
        inventory={leftInventory}
        filter={filter}
        onFilterChange={onFilterChange}
        clothingMode={clothingMode}
        onClothingToggle={onClothingToggle}
      />
    </motion.div>
  );
};

export default LeftInventory;
