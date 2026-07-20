import React from 'react';
import { useDrop } from 'react-dnd';
import { useAppDispatch, useAppSelector } from '../../store';
import { selectItemAmount, setItemAmount } from '../../store/inventory';
import { DragSource } from '../../typings';
import { onUse } from '../../dnd/onUse';
import { onGive } from '../../dnd/onGive';
import { Locale } from '../../store/locale';
import { motion } from 'framer-motion';
import { LuMousePointerClick, LuHeartHandshake } from 'react-icons/lu';

interface IconButtonProps {
  icon: React.ReactNode;
  label: string;
}

const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(({ icon, label }, ref) => (
  <motion.button
    ref={ref as any}
    whileHover={{ y: -2 }}
    whileTap={{ scale: 0.95 }}
    className="control-icon-btn"
    type="button"
  >
    <span className="control-icon-wrap">
      <span className="control-icon-glow" aria-hidden />
      <span className="control-icon">{icon}</span>
    </span>
    <span className="control-label">{label}</span>
  </motion.button>
));

const InventoryControl: React.FC = () => {
  const itemAmount = useAppSelector(selectItemAmount);
  const dispatch = useAppDispatch();

  const [, use] = useDrop<DragSource, void, any>(() => ({
    accept: 'SLOT',
    drop: (source) => {
      source.inventory === 'player' && onUse(source.item);
    },
  }));

  const [, give] = useDrop<DragSource, void, any>(() => ({
    accept: 'SLOT',
    drop: (source) => {
      source.inventory === 'player' && onGive(source.item);
    },
  }));

  const inputHandler = (event: React.ChangeEvent<HTMLInputElement>) => {
    event.target.valueAsNumber =
      isNaN(event.target.valueAsNumber) || event.target.valueAsNumber < 0 ? 0 : Math.floor(event.target.valueAsNumber);
    dispatch(setItemAmount(event.target.valueAsNumber));
  };

  const adjustAmount = (delta: number, currentEl?: HTMLInputElement | null) => {
    const input = currentEl;
    if (!input) return;
    const next = Math.max(0, (parseInt(input.value || '0', 10) || 0) + delta);
    input.value = String(next);
    dispatch(setItemAmount(next));
  };

  const inputRef = React.useRef<HTMLInputElement>(null);

  return (
    <motion.div
      className="control-column"
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
    >
      <IconButton
        icon={<LuMousePointerClick size={26} strokeWidth={1.7} />}
        label={Locale.ui_use || 'Use'}
        ref={use as any}
      />

      <div className="control-amount-wrap">
        <div className="control-amount-pill">
          <button
            type="button"
            className="control-amount-step"
            onClick={() => adjustAmount(-1, inputRef.current)}
            aria-label="Decrease amount"
          >
            −
          </button>
          <input
            ref={inputRef}
            type="number"
            defaultValue={itemAmount}
            onChange={inputHandler}
            min={0}
            aria-label="Amount"
          />
          <button
            type="button"
            className="control-amount-step"
            onClick={() => adjustAmount(1, inputRef.current)}
            aria-label="Increase amount"
          >
            +
          </button>
        </div>
      </div>

      <IconButton
        icon={<LuHeartHandshake size={26} strokeWidth={1.7} />}
        label={Locale.ui_give || 'Give'}
        ref={give as any}
      />
    </motion.div>
  );
};

export default InventoryControl;
