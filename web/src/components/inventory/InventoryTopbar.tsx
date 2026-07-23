import React, { useMemo } from 'react';
import { useAppSelector } from '../../store';
import { selectLeftInventory } from '../../store/inventory';
import { Locale } from '../../store/locale';
import { LuWallet, LuCreditCard, LuUserSquare, LuUser, LuBox } from 'react-icons/lu';
import { motion } from 'framer-motion';
import { useNexConfig } from '../../hooks/useNexConfig';

const findItemCount = (items: any[], name: string) =>
  items.find((i) => i.name === name)?.count ?? 0;

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.03,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.15, ease: 'easeOut' } },
} as const;

const InventoryTopbar: React.FC = () => {
  const left = useAppSelector(selectLeftInventory);
  const { profile } = useNexConfig();

  const stats = useMemo(() => {
    const cash = findItemCount(left.items as any[], 'money') || findItemCount(left.items as any[], 'cash');
    const bank = findItemCount(left.items as any[], 'black_money') || findItemCount(left.items as any[], 'bank');
    return { cash, bank };
  }, [left.items]);

  const $ = Locale.$ || '$';
  const displayName = profile.name || left.label || 'PLAYER';
  const displayId = profile.identifier;

  return (
    <div className="inventory-topbar">
      <motion.div
        className="inventory-topbar-right"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div className="profile-avatar" variants={itemVariants}>
          {profile.avatarUrl ? (
            <img src={profile.avatarUrl} alt="" className="profile-avatar-img" />
          ) : (
            <LuUser />
          )}
        </motion.div>

        <motion.div className="profile-text" variants={itemVariants}>
          <div className="profile-name">{displayName}</div>
          <div className="profile-stats">
            <span className="profile-stat profile-stat--cash">
              <LuWallet />
              <span>
                {$}
                {stats.cash.toLocaleString('en-us')}
              </span>
            </span>
            <span className="profile-stat profile-stat--bank">
              <LuCreditCard />
              <span>
                {$}
                {stats.bank.toLocaleString('en-us')}
              </span>
            </span>
            {displayId !== undefined && displayId !== null && (
              <span className="profile-stat">
                <LuUserSquare />
                <span>{displayId}</span>
              </span>
            )}
          </div>
        </motion.div>

        <motion.div className="profile-emblem" variants={itemVariants}>
          <LuBox />
        </motion.div>
      </motion.div>
    </div>
  );
};

export default InventoryTopbar;
