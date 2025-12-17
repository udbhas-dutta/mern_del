import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/authSlice';
import ordersReducer from '../features/orderSlice';


export const store = configureStore({
  reducer: {
    auth: authReducer,
    orders: ordersReducer
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;