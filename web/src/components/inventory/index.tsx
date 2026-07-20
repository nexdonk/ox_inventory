import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import useNuiEvent from '../../hooks/useNuiEvent';
import InventoryControl from './InventoryControl';
import InventoryHotbar from './InventoryHotbar';
import InventoryTopbar from './InventoryTopbar';
import InventoryBottomBar from './InventoryBottomBar';
import UsefulControls from './UsefulControls';
import ClothingPanel from './ClothingPanel';
import { useAppDispatch } from '../../store';
import { refreshSlots, setAdditionalMetadata, setupInventory } from '../../store/inventory';
import { useExitListener } from '../../hooks/useExitListener';
import type { Inventory as InventoryProps } from '../../typings';
import RightInventory from './RightInventory';
import LeftInventory from './LeftInventory';
import Tooltip from '../utils/Tooltip';
import { closeTooltip } from '../../store/tooltip';
import InventoryContext from './InventoryContext';
import { closeContextMenu } from '../../store/contextMenu';
import { fetchNui } from '../../utils/fetchNui';
import type { ItemFilter } from '../../utils/itemFilter';

const Inventory: React.FC = () => {
  const [inventoryVisible, setInventoryVisible] = useState(false);
  const [infoVisible, setInfoVisible] = useState(false);
  const [filter, setFilter] = useState<ItemFilter>('all');
  const [clothingMode, setClothingMode] = useState(false);
  const dispatch = useAppDispatch();

  useNuiEvent<boolean>('setInventoryVisible', setInventoryVisible);
  useNuiEvent<false>('closeInventory', () => {
    setInventoryVisible(false);
    setClothingMode(false);
    setFilter('all');
    dispatch(closeContextMenu());
    dispatch(closeTooltip());
  });
  useExitListener(setInventoryVisible);

  useNuiEvent<{
    leftInventory?: InventoryProps;
    rightInventory?: InventoryProps;
  }>('setupInventory', (data) => {
    dispatch(setupInventory(data));
    !inventoryVisible && setInventoryVisible(true);
  });

  useNuiEvent('refreshSlots', (data) => dispatch(refreshSlots(data)));

  useNuiEvent('displayMetadata', (data: Array<{ metadata: string; value: string }>) => {
    dispatch(setAdditionalMetadata(data));
  });

  const handleClose = () => {
    setClothingMode(false);
    setInventoryVisible(false);
    setFilter('all');
    dispatch(closeContextMenu());
    dispatch(closeTooltip());
    fetchNui('exit').catch(() => {});
  };

  return (
    <>
      <AnimatePresence>
        {inventoryVisible && (
          <motion.div
            key="inventory-root"
            className="inventory-shell"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
          >
            <InventoryTopbar />
            <div className="inventory-content">
              <LeftInventory
                filter={filter}
                onFilterChange={setFilter}
                clothingMode={clothingMode}
                onClothingToggle={() => setClothingMode((v) => !v)}
              />
              <AnimatePresence>
                {clothingMode ? (
                  <ClothingPanel key="clothing" onClose={() => setClothingMode(false)} />
                ) : (
                  <InventoryControl key="control" />
                )}
              </AnimatePresence>
              <RightInventory />
            </div>
            <InventoryBottomBar onInfo={() => setInfoVisible(true)} onClose={handleClose} />
            <UsefulControls infoVisible={infoVisible} setInfoVisible={setInfoVisible} />
            <Tooltip />
            <InventoryContext />
          </motion.div>
        )}
      </AnimatePresence>
      <InventoryHotbar />
    </>
  );
};

export default Inventory;
