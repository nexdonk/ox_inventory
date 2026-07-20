import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '.';
import { SlotWithItem } from '../typings';

export interface CartItem {
  item: SlotWithItem;
  quantity: number;
  totalPrice: number;
}

interface CartState {
  items: CartItem[];
}

const initialState: CartState = {
  items: [],
};

export const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addToCart: (state, action: PayloadAction<{ item: SlotWithItem; quantity?: number }>) => {
      const { item, quantity = 1 } = action.payload;
      const existing = state.items.find((c) => c.item.name === item.name);
      const max = item.count ?? Infinity;

      if (existing) {
        existing.quantity = Math.min(existing.quantity + quantity, max);
        existing.totalPrice = (item.price || 0) * existing.quantity;
      } else {
        const q = Math.min(quantity, max);
        state.items.push({ item, quantity: q, totalPrice: (item.price || 0) * q });
      }
    },
    removeFromCart: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter((c) => c.item.name !== action.payload);
    },
    updateQuantity: (state, action: PayloadAction<{ itemName: string; quantity: number }>) => {
      const { itemName, quantity } = action.payload;
      const cartItem = state.items.find((c) => c.item.name === itemName);
      if (!cartItem) return;
      if (quantity <= 0) {
        state.items = state.items.filter((c) => c.item.name !== itemName);
        return;
      }
      const max = cartItem.item.count ?? Infinity;
      cartItem.quantity = Math.min(quantity, max);
      cartItem.totalPrice = (cartItem.item.price || 0) * cartItem.quantity;
    },
    clearCart: (state) => {
      state.items = [];
    },
  },
});

export const { addToCart, removeFromCart, updateQuantity, clearCart } = cartSlice.actions;

export const selectCartItems = (state: RootState) => state.cart.items;
export const selectCartTotal = (state: RootState) =>
  state.cart.items.reduce((sum, c) => sum + c.totalPrice, 0);
export const selectCartItemCount = (state: RootState) =>
  state.cart.items.reduce((sum, c) => sum + c.quantity, 0);

export default cartSlice.reducer;
