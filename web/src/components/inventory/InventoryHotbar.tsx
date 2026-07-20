import React, { useState } from 'react';
import { getItemUrl, isSlotWithItem } from '../../helpers';
import useNuiEvent from '../../hooks/useNuiEvent';
import WeightBar from '../utils/WeightBar';
import { useAppSelector } from '../../store';
import { selectLeftInventory } from '../../store/inventory';
import { Slot, SlotWithItem } from '../../typings';
import { AnimatePresence, motion } from 'framer-motion';

const InventoryHotbar: React.FC = () => {
  const [hotbarVisible, setHotbarVisible] = useState(false);
  const items = useAppSelector(selectLeftInventory).items.slice(0, 5);

  const [handle, setHandle] = useState<NodeJS.Timeout>();
  useNuiEvent('toggleHotbar', () => {
    if (hotbarVisible) {
      setHotbarVisible(false);
    } else {
      if (handle) clearTimeout(handle);
      setHotbarVisible(true);
      setHandle(setTimeout(() => setHotbarVisible(false), 3000));
    }
  });

  const filled = Array.from({ length: 5 }, (_, i) => items[i] ?? ({ slot: i + 1 } as Slot));

  return (
    <AnimatePresence>
      {hotbarVisible && (
        <motion.div
          initial={{ opacity: 0, y: 26 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 18 }}
          transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
          style={{
            position: 'absolute',
            bottom: '2vh',
            left: 0,
            right: 0,
            display: 'flex',
            justifyContent: 'center',
            pointerEvents: 'none',
          }}
        >
          <div
            style={{
              padding: '10px 12px 14px',
              borderRadius: 14,
              background: 'linear-gradient(180deg, rgba(14,14,18,0.85) 0%, rgba(6,6,8,0.9) 100%)',
              border: '1px solid rgba(255,255,255,0.08)',
              boxShadow: '0 18px 40px -16px rgba(0,0,0,0.7)',
              display: 'flex',
              gap: 8,
            }}
          >
            {filled.map((item, idx) => (
              <div
                key={`hotbar-${idx}`}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                {isSlotWithItem(item) ? (
                  <div
                    className="hotbar-item-slot"
                    style={{
                      backgroundImage: `url(${item?.name ? getItemUrl(item as SlotWithItem) : 'none'}`,
                    }}
                  >
                    {item.count !== undefined && item.count !== null && (
                      <div className="slot-count-badge">{`${item.count.toLocaleString('en-us')}x`}</div>
                    )}
                    {item?.durability !== undefined && (
                      <div className="slot-durability">
                        <WeightBar percent={item.durability} durability />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="hotbar-empty-slot" />
                )}
                <div className="hotbar-key-badge">{idx + 1}</div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default InventoryHotbar;
