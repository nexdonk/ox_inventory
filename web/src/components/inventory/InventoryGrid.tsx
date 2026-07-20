import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Inventory } from '../../typings';
import WeightBar from '../utils/WeightBar';
import InventorySlot from './InventorySlot';
import { getTotalWeight } from '../../helpers';
import { useAppSelector } from '../../store';
import { useIntersection } from '../../hooks/useIntersection';
import { LuPackage, LuScale } from 'react-icons/lu';
import { useMatchedGridHeight } from './useMatchedGridHeight';
import { ItemFilter, itemMatchesFilter } from '../../utils/itemFilter';

const PAGE_SIZE = 30;

interface Props {
  inventory: Inventory;
  hideHeader?: boolean;
  startIndex?: number;
  matchLeftHeight?: boolean;
  filter?: ItemFilter;
}

const InventoryGrid: React.FC<Props> = ({ inventory, hideHeader, startIndex = 0, matchLeftHeight, filter = 'all' }) => {
  const weight = useMemo(
    () => (inventory.maxWeight !== undefined ? Math.floor(getTotalWeight(inventory.items) * 1000) / 1000 : 0),
    [inventory.maxWeight, inventory.items]
  );
  const [page, setPage] = useState(0);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const matchedRef = useMatchedGridHeight([inventory.id, inventory.type, matchLeftHeight]);
  const { ref, entry } = useIntersection({ threshold: 0.5 });
  const isBusy = useAppSelector((state) => state.inventory.isBusy);

  useEffect(() => {
    if (entry && entry.isIntersecting) {
      setPage((prev) => ++prev);
    }
  }, [entry]);

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
      <div
        className="inventory-grid-container"
        ref={(node: HTMLDivElement | null) => {
          containerRef.current = node;
          if (matchLeftHeight) matchedRef.current = node;
        }}
      >
        {visibleItems.slice(0, (page + 1) * PAGE_SIZE).map((item, index) => (
          <InventorySlot
            key={`${inventory.type}-${inventory.id}-${item.slot}`}
            item={item}
            ref={index === (page + 1) * PAGE_SIZE - 1 ? ref : null}
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
