import React, { useCallback, useEffect, useRef, useState } from 'react';
import { DragSource, Inventory, InventoryType, Slot, SlotWithItem } from '../../typings';
import { useDrag, useDragDropManager, useDrop } from 'react-dnd';
import { useAppDispatch } from '../../store';
import WeightBar from '../utils/WeightBar';
import { onDrop } from '../../dnd/onDrop';
import { Items } from '../../store/items';
import { canCraftItem, canPurchaseItem, getItemUrl, isSlotWithItem } from '../../helpers';
import { onUse } from '../../dnd/onUse';
import { Locale } from '../../store/locale';
import { onCraft } from '../../dnd/onCraft';
import useNuiEvent from '../../hooks/useNuiEvent';
import { ItemsPayload } from '../../reducers/refreshSlots';
import { closeTooltip, openTooltip } from '../../store/tooltip';
import { openContextMenu } from '../../store/contextMenu';
import { useMergeRefs } from '@floating-ui/react';

interface SlotProps {
  inventoryId: Inventory['id'];
  inventoryType: Inventory['type'];
  inventoryGroups: Inventory['groups'];
  item: Slot;
}

const InventorySlot: React.ForwardRefRenderFunction<HTMLDivElement, SlotProps> = (
  { item, inventoryId, inventoryType, inventoryGroups },
  ref
) => {
  const manager = useDragDropManager();
  const dispatch = useAppDispatch();
  const timerRef = useRef<number | null>(null);
  const prevCountRef = useRef(item.count);
  const [flashCount, setFlashCount] = useState(false);

  useEffect(() => {
    if (prevCountRef.current !== undefined && prevCountRef.current !== item.count && item.count !== undefined) {
      setFlashCount(true);
      const t = window.setTimeout(() => setFlashCount(false), 580);
      return () => window.clearTimeout(t);
    }
    prevCountRef.current = item.count;
  }, [item.count]);

  const canDrag = useCallback(() => {
    return canPurchaseItem(item, { type: inventoryType, groups: inventoryGroups }) && canCraftItem(item, inventoryType);
  }, [item, inventoryType, inventoryGroups]);

  const [{ isDragging }, drag] = useDrag<DragSource, void, { isDragging: boolean }>(
    () => ({
      type: 'SLOT',
      collect: (monitor) => ({
        isDragging: monitor.isDragging(),
      }),
      item: () =>
        isSlotWithItem(item, inventoryType !== InventoryType.SHOP)
          ? {
              inventory: inventoryType,
              item: { name: item.name, slot: item.slot },
              image: item?.name && `url(${getItemUrl(item) || 'none'}`,
            }
          : null,
      canDrag,
    }),
    [inventoryType, item]
  );

  const [{ isOver }, drop] = useDrop<DragSource, void, { isOver: boolean }>(
    () => ({
      accept: 'SLOT',
      collect: (monitor) => ({ isOver: monitor.isOver() }),
      drop: (source) => {
        dispatch(closeTooltip());
        switch (source.inventory) {
          case InventoryType.SHOP:
            // Shop slots can only be dragged into the cart's drop zone — direct
            // drag-to-buy is intentionally disabled so every purchase routes
            // through the cart/checkout flow.
            break;
          case InventoryType.CRAFTING:
            onCraft(source, { inventory: inventoryType, item: { slot: item.slot } });
            break;
          default:
            onDrop(source, { inventory: inventoryType, item: { slot: item.slot } });
            break;
        }
      },
      canDrop: (source) =>
        (source.item.slot !== item.slot || source.inventory !== inventoryType) &&
        inventoryType !== InventoryType.SHOP &&
        inventoryType !== InventoryType.CRAFTING,
    }),
    [inventoryType, item]
  );

  useNuiEvent('refreshSlots', (data: { items?: ItemsPayload | ItemsPayload[] }) => {
    if (!isDragging && !data.items) return;
    if (!Array.isArray(data.items)) return;
    const itemSlot = data.items.find(
      (dataItem) => dataItem.item.slot === item.slot && dataItem.inventory === inventoryId
    );
    if (!itemSlot) return;
    manager.dispatch({ type: 'dnd-core/END_DRAG' });
  });

  const connectRef = (element: HTMLDivElement) => drag(drop(element));

  const handleContext = (event: React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (inventoryType !== 'player' || !isSlotWithItem(item)) return;
    dispatch(openContextMenu({ item, coords: { x: event.clientX, y: event.clientY } }));
  };

  const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    dispatch(closeTooltip());
    if (timerRef.current) clearTimeout(timerRef.current);
    if (event.ctrlKey && isSlotWithItem(item) && inventoryType !== 'shop' && inventoryType !== 'crafting') {
      onDrop({ item: item, inventory: inventoryType });
    } else if (event.altKey && isSlotWithItem(item) && inventoryType === 'player') {
      onUse(item);
    }
  };

  const refs = useMergeRefs([connectRef, ref]);
  const locked =
    !canPurchaseItem(item, { type: inventoryType, groups: inventoryGroups }) || !canCraftItem(item, inventoryType);

  return (
    <div
      ref={refs}
      onContextMenu={handleContext}
      onClick={handleClick}
      className={`inventory-slot${locked ? ' inventory-slot--locked' : ''}${isOver ? ' inventory-slot--over' : ''}`}
      style={{
        opacity: isDragging ? 0.35 : undefined,
        backgroundImage: `url(${item?.name ? getItemUrl(item as SlotWithItem) : 'none'}`,
      }}
    >
      {isSlotWithItem(item) && (
        <div
          className="item-slot-wrapper"
          onMouseEnter={() => {
            timerRef.current = window.setTimeout(() => {
              dispatch(openTooltip({ item, inventoryType }));
            }, 380) as unknown as number;
          }}
          onMouseLeave={() => {
            dispatch(closeTooltip());
            if (timerRef.current) {
              clearTimeout(timerRef.current);
              timerRef.current = null;
            }
          }}
        >
          {item.weight !== undefined && item.weight > 0 && (
            <div className="slot-weight-badge">
              {item.weight >= 1000
                ? `${(item.weight / 1000).toFixed(2)}kg`
                : `${item.weight.toLocaleString('en-us')}g`}
            </div>
          )}

          {item.count !== undefined && item.count !== null && (
            <div className={`slot-count-badge${flashCount ? ' slot-count-badge--flash' : ''}`}>
              {`${item.count.toLocaleString('en-us')}x`}
            </div>
          )}

          {inventoryType === 'shop' && item?.price !== undefined && item.price > 0 ? (
            <div className="slot-price-badge">
              {item?.currency && item.currency !== 'money' && item.currency !== 'black_money' ? (
                <>
                  <img
                    src={getItemUrl(item.currency)}
                    alt=""
                    style={{ width: '1.4vh', height: 'auto', imageRendering: '-webkit-optimize-contrast' }}
                  />
                  <span>{item.price.toLocaleString('en-us')}</span>
                </>
              ) : (
                <span style={{ color: item.currency === 'black_money' ? '#cfcfd6' : '#fafafa' }}>
                  {Locale.$ || '$'}
                  {item.price.toLocaleString('en-us')}
                </span>
              )}
            </div>
          ) : (
            <div className="slot-label">
              {item.metadata?.label ? item.metadata.label : Items[item.name]?.label || item.name}
            </div>
          )}

          {inventoryType !== 'shop' && item?.durability !== undefined && (
            <div className="slot-durability">
              <WeightBar percent={item.durability} durability />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default React.memo(React.forwardRef(InventorySlot));
