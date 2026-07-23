import React, { useContext } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import useNuiEvent from '../../hooks/useNuiEvent';
import useQueue from '../../hooks/useQueue';
import { Locale } from '../../store/locale';
import { getItemUrl } from '../../helpers';
import { SlotWithItem } from '../../typings';
import { Items } from '../../store/items';

interface ItemNotificationProps {
  item: SlotWithItem;
  text: string;
  count?: number;
}

export const ItemNotificationsContext = React.createContext<{
  add: (item: ItemNotificationProps) => void;
} | null>(null);

export const useItemNotifications = () => {
  const itemNotificationsContext = useContext(ItemNotificationsContext);
  if (!itemNotificationsContext) throw new Error(`ItemNotificationsContext undefined`);
  return itemNotificationsContext;
};

const formatWeight = (weight?: number) => {
  if (!weight || weight <= 0) return null;
  return weight >= 1000
    ? `${(weight / 1000).toLocaleString('en-us', { minimumFractionDigits: 2 })}kg`
    : `${weight.toLocaleString('en-us')}g`;
};

const ItemNotification: React.FC<{ item: ItemNotificationProps }> = ({ item }) => {
  const slotItem = item.item;
  const itemData = Items[slotItem.name];
  const label = slotItem.metadata?.label || itemData?.label || slotItem.name;
  const description = slotItem.metadata?.description || itemData?.description;
  const weightStr = formatWeight(slotItem.weight);
  const countStr = item.count !== undefined && item.count !== null ? `${item.count.toLocaleString('en-us')}x` : null;
  const durabilityStr =
    typeof slotItem.durability === 'number' ? `${Math.trunc(slotItem.durability)}% DUR` : null;

  const meta = [countStr, weightStr, durabilityStr].filter(Boolean) as string[];

  return (
    <motion.div
      className="item-notification"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8, transition: { duration: 0.12 } }}
      transition={{ duration: 0.15, ease: 'easeOut' }}
    >
      <div
        className="item-notification-icon"
        style={{ backgroundImage: `url(${getItemUrl(slotItem) || 'none'})` }}
      />
      <div className="item-notification-text">
        <div className="item-notification-action">{item.text}</div>
        <div className="item-notification-name">{label}</div>
        {meta.length > 0 && (
          <div className="item-notification-meta">
            {meta.map((m, i) => (
              <React.Fragment key={i}>
                {i > 0 && <span className="item-notification-meta-sep">·</span>}
                <span>{m}</span>
              </React.Fragment>
            ))}
          </div>
        )}
        {description && <div className="item-notification-desc">{description}</div>}
      </div>
    </motion.div>
  );
};

export const ItemNotificationsProvider = ({ children }: { children: React.ReactNode }) => {
  const queue = useQueue<{
    id: number;
    item: ItemNotificationProps;
  }>();

  const add = (item: ItemNotificationProps) => {
    const notification = { id: Date.now() + Math.random(), item };
    queue.add(notification);

    const timeout = setTimeout(() => {
      queue.remove();
      clearTimeout(timeout);
    }, 2800);
  };

  useNuiEvent<[item: SlotWithItem, text: string, count?: number]>('itemNotify', ([item, text, count]) => {
    const action = count ? `${Locale[text]} ${count}x` : `${Locale[text]}`;
    add({ item, text: action, count });
  });

  return (
    <ItemNotificationsContext.Provider value={{ add }}>
      {children}
      {createPortal(
        <div className="item-notification-container">
          <AnimatePresence>
            {queue.values.map((notification) => (
              <ItemNotification key={notification.id} item={notification.item} />
            ))}
          </AnimatePresence>
        </div>,
        document.body
      )}
    </ItemNotificationsContext.Provider>
  );
};
