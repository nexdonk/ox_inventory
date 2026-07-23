import React from 'react';
import InventoryGrid from './InventoryGrid';
import { useAppSelector } from '../../store';
import { selectRightInventory } from '../../store/inventory';
import SectionHeader from './SectionHeader';
import { motion } from 'framer-motion';
import { LuStore, LuHammer, LuArchive, LuBox, LuBriefcase, LuPackagePlus } from 'react-icons/lu';
import { getTotalWeight } from '../../helpers';
import ShoppingCart from './ShoppingCart';

const TYPE_LABELS: Record<string, string> = {
  shop: 'Shop',
  crafting: 'Crafting',
  drop: 'Ground Cache',
  newdrop: 'Drop Zone',
  container: 'Container',
  trunk: 'Trunk',
  glovebox: 'Glovebox',
  stash: 'Other Inventory',
  player: 'Other Player',
  inspect: 'Inspecting',
};

const TYPE_SUBTITLES: Record<string, string> = {
  shop: 'Browse and purchase items from the shop.',
  crafting: 'Combine ingredients to craft items.',
  drop: 'Pick up nearby loot.',
  newdrop: 'Drag items here to drop them.',
  container: 'Items inside this container.',
  trunk: 'Vehicle trunk storage.',
  glovebox: 'Vehicle glovebox storage.',
  stash: 'Access nearby players, vehicles, or storages.',
  player: 'Other player inventory.',
  inspect: 'Viewing player inventory.',
};

const RightInventory: React.FC = () => {
  const rightInventory = useAppSelector(selectRightInventory);
  const weight =
    rightInventory.maxWeight !== undefined ? Math.floor(getTotalWeight(rightInventory.items) * 1000) / 1000 : 0;

  const title = TYPE_LABELS[rightInventory.type] ?? rightInventory.type;
  const subtitle = TYPE_SUBTITLES[rightInventory.type] ?? rightInventory.label;

  const isShop = rightInventory.type === 'shop';

  const Icon =
    rightInventory.type === 'shop'
      ? LuStore
      : rightInventory.type === 'crafting'
      ? LuHammer
      : rightInventory.type === 'drop'
      ? LuArchive
      : rightInventory.type === 'newdrop'
      ? LuPackagePlus
      : rightInventory.type === 'stash'
      ? LuBriefcase
      : LuBox;

  return (
    <motion.div
      className={'inventory-side inventory-side--right' + (isShop ? ' inventory-side--shop' : '')}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.12, ease: 'easeOut' }}
    >
      <SectionHeader
        icon={<Icon size={14} />}
        tone={rightInventory.type || undefined}
        title={title}
        subtitle={subtitle}
        weight={rightInventory.maxWeight ? { current: weight, max: rightInventory.maxWeight } : undefined}
      />

      {/* Fixed 5 rows — always mirrors the left grid exactly. */}
      <InventoryGrid inventory={rightInventory} hideHeader />

      {isShop && <ShoppingCart />}
    </motion.div>
  );
};

export default RightInventory;
