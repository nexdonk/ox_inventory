import React, { useMemo } from 'react';
import { Inventory } from '../../typings';
import WeightBar from '../utils/WeightBar';
import InventorySlot from './InventorySlot';
import { getTotalWeight } from '../../helpers';
import { useAppSelector } from '../../store';
import { LuPackage, LuScale } from 'react-icons/lu';
import { ItemFilter, itemMatchesFilter } from '../../utils/itemFilter';

interface Props {
  inventory: Inventory;
  hideHeader?: boolean;
  startIndex?: number;
  filter?: ItemFilter;
}

const InventoryGrid: React.FC<Props> = ({ inventory, hideHeader, startIndex = 0, filter = 'all' }) => {
  const weight = useMemo(
    () => (inventory.maxWeight !== undefined ? Math.floor(getTotalWeight(inventory.items) * 1000) / 1000 : 0),
    [inventory.maxWeight, inventory.items]
  );
  const isBusy = useAppSelector((state) => state.inventory.isBusy);

  const visibleItems = useMemo(() => {
    const sliced = inventory.items.slice(startIndex);
    if (filter === 'all') return sliced;
    return sliced.filter((item) => itemMatchesFilter(item, filter));
  }, [inventory.items, startIndex, filter]);
  const percent = inventory.maxWeight ? (weight / inventory.maxWeight) * 100 : 0;

  return (
    <div className="inventory-grid-wrapper" style={{ pointerEvents: isBusy ? 'none' : 'auto' }}>
      {!hideHeader && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div className="inventory-grid-header-wrapper">
            <div className="label">
              <span className="dot" />
              <LuPackage size={12} style={{ opacity: 0.7 }} />
              <span>{inventory.label}</span>
            </div>
            {inventory.maxWeight && (
              <div className="meta" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <LuScale size={12} style={{ opacity: 0.55 }} />
                <span>
                  {(weight / 1000).toFixed(2)}/{(inventory.maxWeight / 1000).toFixed(0)}
                  <span style={{ opacity: 0.45, marginLeft: 2 }}>kg</span>
                </span>
              </div>
            )}
          </div>
          <WeightBar percent={percent} />
        </div>
      )}
      {/* All slots render up front — no lazy paging. Paged loading grew the
          scroll content a beat after opening, which resized the scrollbar
          thumb and read as a stutter on every open. */}
      <div className="inventory-grid-container">
        {visibleItems.map((item) => (
          <InventorySlot
            key={`${inventory.type}-${inventory.id}-${item.slot}`}
            item={item}
            inventoryType={inventory.type}
            inventoryGroups={inventory.groups}
            inventoryId={inventory.id}
          />
        ))}
      </div>
    </div>
  );
};

export default InventoryGrid;
