import { Request, Response } from "express";
import Order, { OrderStage } from "../models/Order";
import { Server } from "socket.io";
import User from "../models/User";

const getIO = (req: Request): Server => req.app.get("socketio");

// 1. CREATE ORDER -- buyer only
export const createOrder = async (req: Request, res: Response) => {
  try {
    const { items } = req.body;
    const buyerId = (req as any).user.id;

    const activeOrder = await Order.findOne({
      buyerId,
      stage: { $ne: OrderStage.DELIVERED },
    });

    if (activeOrder) {
      return res
        .status(400)
        .json({ message: "You already have an active order." });
    }

    const newOrder = new Order({
      items,
      sellerId: null, //no seller assigned yet
      buyerId,
      stage: OrderStage.PLACED,
      // MANUAL HISTORY ENTRY FOR START
      stageHistory: [{ stage: OrderStage.PLACED, timestamp: new Date() }],
    });

    await newOrder.save();

    const io = getIO(req);
    io.emit("order_created", newOrder); // notify admin

    res.status(201).json(newOrder);
  } catch (error) {
    res.status(500).json({ message: "Error creating order", error });
  }
};

// 2. GET ORDERS
export const getOrders = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    let query = {};

    if (user.role === "Seller") {
      query = { sellerId: user.id };
    } else if (user.role === "Buyer") {
      query = { buyerId: user.id };
    }

    const orders = await Order.find(query)
      .populate("buyerId", "name email") // fetch buyer details
      .populate("sellerId", "name email") // fetch seller details
      .sort({ updatedAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: "Error fetching orders", error });
  }
};

// 3. UPDATE STAGE (Seller)
export const updateStage = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const order = await Order.findById(id);

    if (!order) return res.status(404).json({ message: "Order not found" });

    const stages = Object.values(OrderStage);
    const currentIdx = stages.indexOf(order.stage as OrderStage);

    if (currentIdx >= stages.length - 1) {
      return res.status(400).json({ message: "Order is already delivered" });
    }

    const nextStage = stages[currentIdx + 1]!;

    // UPDATE STAGE
    order.stage = nextStage;
    // MANUAL HISTORY PUSH
    order.stageHistory.push({ stage: nextStage, timestamp: new Date() });

    await order.save();

    const poupulatedOrder = await order.populate("buyerId", "name email");

    const io = getIO(req);
    io.emit("order_updated", order);

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: "Error updating stage", error });
  }
};

// 4. ASSOCIATE BUYER (Admin)
export const associateBuyer = async (req: Request, res: Response) => {
  try {
    const { orderId, buyerId } = req.body;

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });

    if (order.stage !== OrderStage.PLACED) {
      return res
        .status(400)
        .json({ message: "Can only associate buyer to Placed orders" });
    }

    order.buyerId = buyerId;
    // UPDATE STAGE
    order.stage = OrderStage.BUYER_ASSOCIATED;
    // MANUAL HISTORY PUSH
    order.stageHistory.push({
      stage: OrderStage.BUYER_ASSOCIATED,
      timestamp: new Date(),
    });

    await order.save();

    const io = getIO(req);
    io.emit("order_updated", order);

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: "Error associating buyer", error });
  }
};

// 5. ASSIGN SELLER -- admin
export const assignSeller = async (req: Request, res: Response) => {
  try {
    const { orderId, sellerId } = req.body;

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });

    const seller = await User.findById(sellerId);
    if (!seller || seller.role !== "Seller") {
      return res.status(400).json({ message: "Invalid Seller ID" });
    }

    order.sellerId = sellerId;

    await order.save();

    const populatedOrder = await order.populate([
      { path: "buyerId", select: "name email" },
      { path: "sellerId", select: "name email" },
    ]);

    const io = getIO(req);
    io.emit("order_updated", order); // Updates Seller Dashboard instantly

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: "Error assigning seller", error });
  }
};

// 6. DELETE ORDER
export const deleteOrder = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await Order.findByIdAndDelete(id);

    const io = getIO(req);
    io.emit("order_deleted", id);

    res.json({ message: "Order removed" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting order" });
  }
};
