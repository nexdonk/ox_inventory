import { createAsyncThunk } from '@reduxjs/toolkit';
import { fetchNui } from '../utils/fetchNui';
import { CartItem, clearCart } from '../store/cart';

export const checkoutCart = createAsyncThunk(
  'cart/checkout',
  async (
    data: { shopId: string; items: CartItem[]; total: number },
    { dispatch, rejectWithValue }
  ) => {
    try {
      const payload = {
        shopId: data.shopId,
        items: data.items.map((c) => ({
          name: c.item.name,
          slot: c.item.slot,
          quantity: c.quantity,
          price: c.item.price || 0,
          currency: c.item.currency,
        })),
        total: data.total,
      };

      const ok = await fetchNui<boolean>('checkoutCart', payload);
      if (ok === false) return rejectWithValue('Checkout failed');
      dispatch(clearCart());
      return true;
    } catch (err) {
      return rejectWithValue('Checkout failed');
    }
  }
);
