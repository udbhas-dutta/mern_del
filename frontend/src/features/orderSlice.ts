import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

// Match the backend interface
export interface Order {
  _id: string;
  items: string[];
  stage: string;
  buyerId?: string;
  sellerId: string;
  createdAt: string;
  updatedAt: string;
  // Add other fields as needed
}

interface OrdersState {
  orders: Order[];
  loading: boolean;
}

const initialState: OrdersState = {
  orders: [],
  loading: false,
};

const ordersSlice = createSlice({
  name: 'orders',
  initialState,
  reducers: {
    setOrders: (state, action: PayloadAction<Order[]>) => {
      state.orders = action.payload;
    },
    addOrder: (state, action: PayloadAction<Order>) => {
      state.orders.unshift(action.payload); // Add new order to top
    },
    updateOrderRealTime: (state, action: PayloadAction<Order>) => {
      const index = state.orders.findIndex(o => o._id === action.payload._id);
      if (index !== -1) {
        // Update existing order
        state.orders[index] = action.payload;
      } else {
        // Or if it's a new assignment (e.g., for Seller), add it
        state.orders.unshift(action.payload);
      }
    },
    deleteOrderRealTime: (state, action: PayloadAction<string>) => {
      state.orders = state.orders.filter(o => o._id !== action.payload);
    }
  },
});

export const { setOrders, addOrder, updateOrderRealTime, deleteOrderRealTime } = ordersSlice.actions;
export default ordersSlice.reducer;