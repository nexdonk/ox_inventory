import React, { useEffect, useState } from 'react';
import { useDrop } from 'react-dnd';
import { LuShoppingCart, LuTrash2, LuPlus, LuMinus, LuX, LuWallet } from 'react-icons/lu';
import { useAppDispatch, useAppSelector } from '../../store';
import {
  addToCart,
  removeFromCart,
  updateQuantity,
  clearCart,
  selectCartItems,
  selectCartTotal,
  selectCartItemCount,
} from '../../store/cart';
import { selectRightInventory, selectItemAmount } from '../../store/inventory';
import { DragSource, InventoryType, SlotWithItem } from '../../typings';
import { isSlotWithItem, getItemUrl } from '../../helpers';
import { Items } from '../../store/items';
import { Locale } from '../../store/locale';
import { checkoutCart } from '../../thunks/checkoutCart';
import { useMatchedCartHeight } from './useMatchedGridHeight';

const ShoppingCart: React.FC = () => {
  const dispatch = useAppDispatch();
  const cartItems = useAppSelector(selectCartItems);
  const cartTotal = useAppSelector(selectCartTotal);
  const cartCount = useAppSelector(selectCartItemCount);
  const rightInventory = useAppSelector(selectRightInventory);
  const itemAmount = useAppSelector(selectItemAmount);
  const [busy, setBusy] = useState(false);
  const cartRef = useMatchedCartHeight([rightInventory.id]);

  // Reset cart whenever the active shop changes (or right side closes).
  useEffect(() => {
    dispatch(clearCart());
  }, [rightInventory.id, dispatch]);

  const [{ isOver, canDrop }, drop] = useDrop<DragSource, void, { isOver: boolean; canDrop: boolean }>(
    () => ({
      accept: 'SLOT',
      canDrop: (source) => source.inventory === InventoryType.SHOP,
      drop: (source) => {
        const slot = rightInventory.items.find((i) => i.slot === source.item.slot);
        if (slot && isSlotWithItem(slot)) {
          const qty = itemAmount > 0 ? itemAmount : 1;
          dispatch(addToCart({ item: slot as SlotWithItem, quantity: qty }));
        }
      },
      collect: (monitor) => ({ isOver: monitor.isOver(), canDrop: monitor.canDrop() }),
    }),
    [rightInventory, itemAmount]
  );

  const setQty = (name: string, q: number) => dispatch(updateQuantity({ itemName: name, quantity: q }));
  const remove = (name: string) => dispatch(removeFromCart(name));

  const handleCheckout = async () => {
    if (cartItems.length === 0 || busy) return;
    setBusy(true);
    try {
      await dispatch(
        checkoutCart({ shopId: rightInventory.id, items: cartItems, total: cartTotal })
      ).unwrap();
    } catch {
      /* server already notified */
    } finally {
      setBusy(false);
    }
  };

  const dropActive = isOver && canDrop;
  const dropArmed = canDrop && !isOver;
  const $ = Locale.$ || '$';

  return (
    <div className="nex-cart" ref={cartRef}>
      <div className="nex-cart-header">
        <div className="nex-cart-title">
          <LuShoppingCart size={14} />
          <span>Cart</span>
        </div>
        <span className="nex-cart-count">
          {cartCount} item{cartCount === 1 ? '' : 's'}
        </span>
      </div>

      <div
        ref={drop}
        className={
          'nex-cart-drop' +
          (dropActive ? ' is-active' : '') +
          (dropArmed ? ' is-armed' : '')
        }
      >
        {cartItems.length === 0 ? (
          <div className="nex-cart-empty">
            <LuShoppingCart size={28} />
            <p>Drag shop items here to add them to your cart.</p>
          </div>
        ) : (
          <div className="nex-cart-items">
            {cartItems.map((c) => {
              const data = Items[c.item.name];
              const url = getItemUrl(c.item);
              const max = c.item.count ?? 999;
              return (
                <div key={c.item.name} className="nex-cart-row">
                  <div
                    className="nex-cart-thumb"
                    style={{ backgroundImage: url ? `url(${url})` : 'none' }}
                  />
                  <div className="nex-cart-info">
                    <span className="nex-cart-name">
                      {c.item.metadata?.label || data?.label || c.item.name}
                    </span>
                    <span className="nex-cart-unit">
                      {$}
                      {(c.item.price || 0).toLocaleString('en-us')} ea
                    </span>
                  </div>
                  <div className="nex-cart-qty">
                    <button
                      className="nex-cart-step"
                      onClick={() => setQty(c.item.name, c.quantity - 1)}
                      aria-label="Decrease"
                    >
                      <LuMinus size={11} />
                    </button>
                    <input
                      type="number"
                      value={c.quantity}
                      min={1}
                      max={max}
                      onChange={(e) => setQty(c.item.name, parseInt(e.target.value) || 1)}
                    />
                    <button
                      className="nex-cart-step"
                      onClick={() => setQty(c.item.name, c.quantity + 1)}
                      disabled={c.quantity >= max}
                      aria-label="Increase"
                    >
                      <LuPlus size={11} />
                    </button>
                  </div>
                  <span className="nex-cart-line-total">
                    {$}
                    {c.totalPrice.toLocaleString('en-us')}
                  </span>
                  <button
                    className="nex-cart-remove"
                    onClick={() => remove(c.item.name)}
                    aria-label="Remove"
                  >
                    <LuX size={12} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="nex-cart-footer">
        <div className="nex-cart-total-row">
          <span className="nex-cart-total-label">Total</span>
          <span className="nex-cart-total-amount">
            {$}
            {cartTotal.toLocaleString('en-us')}
          </span>
        </div>
        <div className="nex-cart-actions">
          <button
            type="button"
            className="nex-cart-clear"
            onClick={() => dispatch(clearCart())}
            disabled={cartItems.length === 0 || busy}
          >
            <LuTrash2 size={12} />
            Clear
          </button>
          <button
            type="button"
            className="nex-cart-checkout"
            onClick={handleCheckout}
            disabled={cartItems.length === 0 || busy}
          >
            <LuWallet size={14} />
            {busy ? 'Processing…' : 'Checkout'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShoppingCart;
