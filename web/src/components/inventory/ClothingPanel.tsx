import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { fetchNui } from '../../utils/fetchNui';
import {
  LuShield, LuShirt, LuKey, LuBriefcase, LuGem, LuHand, LuFootprints,
  LuScissors, LuPalette, LuFeather,
  LuHardHat, LuEye, LuLightbulb, LuWatch, LuRotateCcw,
} from 'react-icons/lu';

interface ClothingItem { action: string; icon: React.ReactNode; label: string; }
interface Props { onClose: () => void; }

// All toggleable items — must match keys in CLOTHING_COMPONENTS / CLOTHING_PROPS
// in custom/client_clothing.lua.
const LEFT_BUTTONS: ClothingItem[] = [
  { action: 'mask',       icon: <LuShield strokeWidth={1.6} />,    label: 'Mask' },
  { action: 'hair',       icon: <LuScissors strokeWidth={1.6} />,  label: 'Hair' },
  { action: 'gloves',     icon: <LuHand strokeWidth={1.6} />,      label: 'Gloves / Torso' },
  { action: 'undershirt', icon: <LuFeather strokeWidth={1.6} />,   label: 'Undershirt' },
  { action: 'shirt',      icon: <LuShirt strokeWidth={1.6} />,     label: 'Shirt / Top' },
  { action: 'vest',       icon: <LuKey strokeWidth={1.6} />,       label: 'Vest / Armor' },
  { action: 'pants',      icon: <LuPalette strokeWidth={1.6} />,   label: 'Pants' },
  { action: 'shoes',      icon: <LuFootprints strokeWidth={1.6} />, label: 'Shoes' },
];

const RIGHT_BUTTONS: ClothingItem[] = [
  { action: 'hat',       icon: <LuHardHat strokeWidth={1.6} />,    label: 'Hat / Helmet' },
  { action: 'glasses',   icon: <LuEye strokeWidth={1.6} />,        label: 'Glasses' },
  { action: 'earring',   icon: <LuLightbulb strokeWidth={1.6} />,  label: 'Earring' },
  { action: 'watch',     icon: <LuWatch strokeWidth={1.6} />,      label: 'Watch' },
  { action: 'bracelet',  icon: <LuGem strokeWidth={1.6} />,        label: 'Bracelet' },
  { action: 'accessory', icon: <LuGem strokeWidth={1.6} />,        label: 'Accessory' },
  { action: 'bag',       icon: <LuBriefcase strokeWidth={1.6} />,  label: 'Bag / Backpack' },
  { action: 'reset',     icon: <LuRotateCcw strokeWidth={1.8} />,  label: 'Reset everything' },
];

interface ClothingState {
  available: Record<string, boolean>;
  active: Record<string, boolean>;
}

const ClothingPanel: React.FC<Props> = (_props) => {
  const [state, setState] = useState<ClothingState>({ available: {}, active: {} });

  // Tell Lua to spawn / despawn the preview ped
  useEffect(() => {
    fetchNui('togglePedPreview', { enable: true }).catch(() => {});
    return () => {
      fetchNui('togglePedPreview', { enable: false }).catch(() => {});
    };
  }, []);

  // Initial state fetch (which buttons should appear)
  useEffect(() => {
    fetchNui<ClothingState>('getClothingState')
      .then((s) => s && setState(s))
      .catch(() => {});
  }, []);

  const triggerToggle = useCallback((action: string) => {
    fetchNui<ClothingState>('toggleClothing', { action })
      .then((s) => s && setState(s))
      .catch(() => {});
  }, []);

  const renderButton = (item: ClothingItem) => {
    if (!state.available[item.action]) return null;
    const isActive = !!state.active[item.action];

    return (
      <motion.button
        key={item.action}
        type="button"
        whileHover={{ y: -1 }}
        whileTap={{ scale: 0.95 }}
        className={`clothing-btn${isActive ? ' clothing-btn--active' : ''}`}
        onClick={() => triggerToggle(item.action)}
        aria-label={item.label}
        title={isActive ? `${item.label} — removed (click to put back on)` : item.label}
      >
        {item.icon}
      </motion.button>
    );
  };

  return (
    <motion.div
      className="clothing-panel"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4, ease: 'easeInOut' }}
    >
      <div className="clothing-col">
        {LEFT_BUTTONS.map(renderButton)}
      </div>

      <div className="clothing-panel-spacer" aria-hidden />

      <div className="clothing-col">
        {RIGHT_BUTTONS.map(renderButton)}
      </div>
    </motion.div>
  );
};

export default ClothingPanel;
