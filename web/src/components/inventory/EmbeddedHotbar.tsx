import React from 'react';
import { Inventory } from '../../typings';
import InventorySlot from './InventorySlot';
import SectionHeader from './SectionHeader';
import InventoryActions from './InventoryActions';
import { LuLayers } from 'react-icons/lu';
import type { ItemFilter } from '../../utils/itemFilter';

interface Props {
  inventory: Inventory;
  filter: ItemFilter;
  onFilterChange: (f: ItemFilter) => void;
  clothingMode: boolean;
  onClothingToggle: () => void;
}

const EmbeddedHotbar: React.FC<Props> = ({ inventory, filter, onFilterChange, clothingMode, onClothingToggle }) => {
  const items = inventory.items.slice(0, 5);

  return (
    <div className="hotbar-section">
      <div className="hotbar-section-header">
        <SectionHeader icon={<LuLayers size={14} />} tone="hotbar" title="Hotbar" subtitle="Put your items for fast using." />
        <InventoryActions
          filter={filter}
          onFilterChange={onFilterChange}
          clothingMode={clothingMode}
          onClothingToggle={onClothingToggle}
        />
      </div>
      <div className="hotbar-grid-container">
        {items.map((item, index) => (
          <div className="hotbar-cell" key={`embed-hotbar-${inventory.id}-${item.slot}`}>
            <InventorySlot
              item={item}
              inventoryType={inventory.type}
              inventoryGroups={inventory.groups}
              inventoryId={inventory.id}
            />
            <div className="hotbar-key-badge"><span>{index + 1}</span></div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EmbeddedHotbar;
