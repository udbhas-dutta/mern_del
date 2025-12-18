import mongoose, { Schema, Document } from 'mongoose';

export enum OrderStage {
  PLACED = 'Order Placed',
  BUYER_ASSOCIATED = 'Buyer Associated',
  PROCESSING = 'Processing',
  PACKED = 'Packed',
  SHIPPED = 'Shipped',
  OUT_FOR_DELIVERY = 'Out for Delivery',
  DELIVERED = 'Delivered'
}

export interface IOrder extends Document {
  items: string[];
  stage: OrderStage;
  buyerId: mongoose.Schema.Types.ObjectId;
  sellerId?: mongoose.Schema.Types.ObjectId;
  stageHistory: {
    stage: OrderStage;
    timestamp: Date;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const OrderSchema = new Schema<IOrder>({
  items: [{ type: String, required: true }],
  stage: { 
    type: String, 
    enum: Object.values(OrderStage), 
    default: OrderStage.PLACED 
  },
  buyerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  stageHistory: [{
    stage: { type: String, enum: Object.values(OrderStage) },
    timestamp: { type: Date, default: Date.now }
  }]
}, { timestamps: true });


export default mongoose.model<IOrder>('Order', OrderSchema);