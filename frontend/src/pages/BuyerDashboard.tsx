import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import axios, {  } from 'axios';
import type { RootState } from '../app/store';
import { setOrders, updateOrderRealTime, addOrder } from '../features/orderSlice';
import { socket } from '../services/socket';
import { LogOut, Plus, ShoppingBag, X } from 'lucide-react';
import { logout } from '../features/authSlice';
import { useNavigate } from 'react-router-dom';

// Define strict error shape
interface ErrorResponse {
  message: string;
}

// The 7 stages of delivery for the Progress Bar
const STAGES = [
  'Order Placed',
  'Buyer Associated',
  'Processing',
  'Packed',
  'Shipped',
  'Out for Delivery',
  'Delivered'
];

const BuyerDashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, token } = useSelector((state: RootState) => state.auth);
  const { orders } = useSelector((state: RootState) => state.orders);

  // Modal State for creating a new order
  const [showModal, setShowModal] = useState(false);
  const [newItems, setNewItems] = useState('');
  const [sellerIdInput, setSellerIdInput] = useState('');

  useEffect(() => {
    // 1. Fetch Buyer's Orders
    const fetchOrders = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/orders', {
          headers: { Authorization: `Bearer ${token}` }
        });
        dispatch(setOrders(res.data));
      } catch (err) {
        console.error("Failed to fetch orders", err);
      }
    };
    fetchOrders();

    // 2. Real-time Listeners
    socket.on('order_updated', (updatedOrder) => {
      dispatch(updateOrderRealTime(updatedOrder));
    });
    
    // If the buyer creates an order from a different tab, update this one too
    socket.on('order_created', (newOrder) => {
      // Only add if it belongs to this buyer (optional check depending on backend filter)
      if (newOrder.buyerId === user?.id) {
         dispatch(addOrder(newOrder));
      }
    });

    return () => {
      socket.off('order_updated');
      socket.off('order_created');
    };
  }, [dispatch, token, user?.id]);

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const itemsArray = newItems.split(',').map(item => item.trim());
      
      const res = await axios.post('http://localhost:5000/api/orders', {
        items: itemsArray,
        sellerId: sellerIdInput // In a real app, you'd select this from a list
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      dispatch(addOrder(res.data));
      setShowModal(false);
      setNewItems('');
      setSellerIdInput('');
      alert("Order Placed Successfully!");
    } catch (err) {
      let errorMessage = "Something went wrong";
      if (axios.isAxiosError(err)) {
        const errorData = err.response?.data as ErrorResponse;
        errorMessage = errorData?.message || err.message;
      }
      alert("Failed to create order: " + errorMessage);
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8 bg-white p-4 rounded-lg shadow-sm">
        <h1 className="text-2xl font-bold text-gray-800">My Orders</h1>
        <div className="flex items-center gap-4">
          <span className="text-gray-600">Hello, {user?.name}</span>
          <button onClick={handleLogout} className="text-red-600 hover:text-red-700 font-medium flex items-center gap-2">
            <LogOut size={20} /> Logout
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto">
        {/* Create Order Button */}
        <button 
          onClick={() => setShowModal(true)}
          className="mb-6 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-medium flex items-center gap-2 transition shadow-sm"
        >
          <Plus size={20} /> Place New Order
        </button>

        {/* Order List */}
        <div className="space-y-6">
          {orders.length === 0 ? (
            <div className="text-center py-20 text-gray-400 bg-white rounded-xl border border-dashed">
              You have no active orders.
            </div>
          ) : (
            orders.map((order) => {
              // Calculate progress percentage for the bar
              const currentStageIndex = STAGES.indexOf(order.stage);
              const progressPercent = (currentStageIndex / (STAGES.length - 1)) * 100;

              return (
                <div key={order._id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <ShoppingBag size={18} className="text-blue-500"/>
                        <span className="font-bold text-gray-800 text-lg">
                           {order.items.join(", ")}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 font-mono">Order ID: {order._id}</p>
                    </div>
                    <div className="text-right">
                       <span className="inline-block px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-bold uppercase tracking-wide">
                         {order.stage}
                       </span>
                       <p className="text-xs text-gray-400 mt-1">
                         {new Date(order.updatedAt).toLocaleTimeString()}
                       </p>
                    </div>
                  </div>

                  {/* Progress Bar Container */}
                  <div className="relative mt-4">
                    {/* Background Line */}
                    <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-200 -translate-y-1/2 rounded-full"></div>
                    
                    {/* Active Progress Line */}
                    <div 
                      className="absolute top-1/2 left-0 h-1 bg-green-500 -translate-y-1/2 rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${progressPercent}%` }}
                    ></div>

                    {/* Dots for Stages */}
                    <div className="relative flex justify-between z-10">
                      {STAGES.map((stage, index) => {
                        const isCompleted = index <= currentStageIndex;
                        const isCurrent = index === currentStageIndex;

                        return (
                          <div key={stage} className="flex flex-col items-center group">
                            <div 
                              className={`w-4 h-4 rounded-full border-2 transition-all duration-300
                                ${isCompleted 
                                  ? 'bg-green-500 border-green-500 scale-110' 
                                  : 'bg-white border-gray-300'}
                                ${isCurrent ? 'ring-4 ring-green-100' : ''}
                              `}
                            ></div>
                            
                            {/* Only show label for current stage or first/last to avoid clutter on small screens */}
                            <span className={`absolute top-6 text-[10px] font-medium w-20 text-center transition-opacity duration-300
                              ${isCurrent ? 'opacity-100 text-gray-800 font-bold' : 'opacity-0 group-hover:opacity-100 text-gray-500'}
                            `}>
                              {stage}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  {/* Spacer for the floating labels */}
                  <div className="h-6"></div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Simple Create Order Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">New Order</h2>
              <button onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleCreateOrder} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Items (comma separated)</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Laptop, Mouse"
                  className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                  value={newItems}
                  onChange={e => setNewItems(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Seller ID</label>
                <input 
                  type="text" 
                  required
                  placeholder="Paste a Seller ID here"
                  className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                  value={sellerIdInput}
                  onChange={e => setSellerIdInput(e.target.value)}
                />
                <p className="text-xs text-gray-500 mt-1">
                  *In a real app, you would select from a list of sellers.
                </p>
              </div>
              <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg font-bold hover:bg-blue-700">
                Place Order
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BuyerDashboard;