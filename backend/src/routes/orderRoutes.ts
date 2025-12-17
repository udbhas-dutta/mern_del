import express from 'express';
import { createOrder, getOrders, updateStage, associateBuyer, deleteOrder } from '../controllers/orderController';
import { protect, adminOnly } from '../middleware/authMiddleware';

const router = express.Router();

// 1. Create Order (Buyer)
router.post('/', protect, createOrder);

// 2. Get Orders (Buyer/Seller/Admin)
router.get('/', protect, getOrders);

// 3. Update Stage (Seller) - :id is the Order ID
router.put('/:id/stage', protect, updateStage);

// 4. Associate Buyer (Admin Only)
router.put('/associate', protect, adminOnly, associateBuyer);

// 5. Delete Order (Any role allowed by logic, usually Admin/Seller)
router.delete('/:id', protect, deleteOrder);

export default router;