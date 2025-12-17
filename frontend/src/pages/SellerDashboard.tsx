import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';
import type { RootState } from '../app/store';
import { setOrders, updateOrderRealTime } from '../features/orderSlice';
import { socket } from '../services/socket';
import { LogOut, Package, Truck, CheckCircle } from 'lucide-react';
import { logout } from '../features/authSlice';
import { useNavigate } from 'react-router-dom';

interface ErrorResponse{
    message: string;
}

const SellerDashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, token } = useSelector((state: RootState) => state.auth);
  const { orders } = useSelector((state: RootState) => state.orders);

  useEffect(() => {
    // 1. Fetch Seller's Orders
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

    // 2. Real-time Listeners (To update UI if Admin or another Seller tab changes something)
    socket.on('order_updated', (updatedOrder) => {
      dispatch(updateOrderRealTime(updatedOrder));
    });
    
    // Also listen for new orders assigned to this seller
    socket.on('order_created', (newOrder) => {
      // for live updates
      dispatch(updateOrderRealTime(newOrder)); 
    });

    return () => {
      socket.off('order_updated');
      socket.off('order_created');
    };
  }, [dispatch, token]);

const handleNextStage = async (orderId: string) => {
    try {
      const res = await axios.put(`http://localhost:5000/api/orders/${orderId}/stage`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      dispatch(updateOrderRealTime(res.data));
    } catch (err) {
      
      let errorMessage = "Something went wrong";

      if (axios.isAxiosError(err)) {

        // casting data to errormessage interface
        const errorData = err.response?.data as ErrorResponse;
        errorMessage = errorData?.message || err.message;
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }

      alert("Error updating stage: " + errorMessage);
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8 bg-white p-4 rounded-lg shadow-sm">
        <h1 className="text-2xl font-bold text-gray-800">Seller Dashboard</h1>
        <div className="flex items-center gap-4">
          <span className="text-gray-600">Logged in as: {user?.name}</span>
          <button onClick={handleLogout} className="flex items-center gap-2 text-red-600 hover:text-red-700 font-medium">
            <LogOut size={20} /> Logout
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto">
        <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
          <Package className="text-blue-600" /> Active Orders
        </h2>

        {orders.length === 0 ? (
          <div className="text-center py-20 text-gray-500">No orders assigned to you yet.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {orders.map((order) => (
              <div key={order._id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition">
                <div className="p-5">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Order ID</span>
                      <p className="font-mono text-sm text-gray-800">#{order._id.slice(-6)}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold
                      ${order.stage === 'Delivered' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}
                    `}>
                      {order.stage}
                    </span>
                  </div>

                  <div className="mb-6">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Items</span>
                    <ul className="mt-1 space-y-1">
                      {order.items.map((item, i) => (
                        <li key={i} className="text-gray-700 text-sm flex items-center gap-2">
                          <span className="w-1.5 h-1.5 bg-gray-400 rounded-full"></span> {item}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <button 
                    onClick={() => handleNextStage(order._id)}
                    disabled={order.stage === 'Delivered'}
                    className={`w-full py-3 rounded-lg flex items-center justify-center gap-2 font-medium transition
                      ${order.stage === 'Delivered' 
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                        : 'bg-black text-white hover:bg-gray-800 active:scale-95'}
                    `}
                  >
                    {order.stage === 'Delivered' ? (
                      <> <CheckCircle size={18} /> Completed </>
                    ) : (
                      <> <Truck size={18} /> Move to Next Stage </>
                    )}
                  </button>
                </div>
                {/* Footer with Timestamp */}
                <div className="bg-gray-50 px-5 py-3 border-t border-gray-100 text-xs text-gray-500 flex justify-between">
                  <span>Updated: {new Date(order.updatedAt || new Date()).toLocaleTimeString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SellerDashboard;