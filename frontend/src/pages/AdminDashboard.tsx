import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';
import type { RootState } from '../app/store';
import { setOrders, updateOrderRealTime } from '../features/orderSlice';
import { socket } from '../services/socket';
import { LogOut, Users, Link, AlertCircle } from 'lucide-react';
import { logout } from '../features/authSlice';
import { useNavigate } from 'react-router-dom';

// Define strict error shape
interface ErrorResponse {
  message: string;
}

const AdminDashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, token } = useSelector((state: RootState) => state.auth);
  const { orders } = useSelector((state: RootState) => state.orders);

  // Local state to manage the "Buyer ID" input for each order card independently
  const [buyerInputs, setBuyerInputs] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    // 1. Fetch All Orders
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
    
    socket.on('order_created', (newOrder) => {
      dispatch(updateOrderRealTime(newOrder));
    });

    return () => {
      socket.off('order_updated');
      socket.off('order_created');
    };
  }, [dispatch, token]);

  const handleAssociate = async (orderId: string) => {
    const buyerIdToLink = buyerInputs[orderId];

    if (!buyerIdToLink) {
      alert("Please enter a Buyer ID first");
      return;
    }

    try {
      const res = await axios.put(
        `http://localhost:5000/api/orders/associate`, 
        { orderId, buyerId: buyerIdToLink }, 
        { headers: { Authorization: `Bearer ${token}` }}
      );
      
      // Clear input after success
      setBuyerInputs(prev => ({ ...prev, [orderId]: '' }));
      
      // Update Redux immediately
      dispatch(updateOrderRealTime(res.data));
      alert("Buyer associated successfully!");

    } catch (err) {
      // Strict Error Handling (Same as Seller Dashboard)
      let errorMessage = "Something went wrong";

      if (axios.isAxiosError(err)) {
        const errorData = err.response?.data as ErrorResponse;
        errorMessage = errorData?.message || err.message;
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }

      alert("Error associating buyer: " + errorMessage);
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  // Only show orders that need a buyer (Stage: "Order Placed")
  const unassignedOrders = orders.filter(o => o.stage === 'Order Placed');

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8 bg-white p-4 rounded-lg shadow-sm">
        <h1 className="text-2xl font-bold text-gray-800">Admin Dashboard</h1>
        <div className="flex items-center gap-4">
          <span className="text-purple-600 font-medium bg-purple-100 px-3 py-1 rounded-full">
            {user?.role} Access
          </span>
          <button onClick={handleLogout} className="flex items-center gap-2 text-red-600 hover:text-red-700 font-medium">
            <LogOut size={20} /> Logout
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto">
        <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
          <Users className="text-purple-600" /> Unassigned Orders
        </h2>

        {unassignedOrders.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-lg border border-dashed border-gray-300">
            <p className="text-gray-500">No new orders waiting for assignment.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {unassignedOrders.map((order) => (
              <div key={order._id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col md:flex-row justify-between items-center gap-4">
                
                {/* Order Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">
                      ID: {order._id}
                    </span>
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-bold">
                      {order.stage}
                    </span>
                  </div>
                  <h3 className="font-medium text-gray-800">Items: {order.items.join(", ")}</h3>
                </div>

                {/* Action Section */}
                <div className="flex items-center gap-3 w-full md:w-auto">
                  <input 
                    type="text" 
                    placeholder="Paste Buyer ID here..."
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full md:w-64 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    value={buyerInputs[order._id] || ''}
                    onChange={(e) => setBuyerInputs({ ...buyerInputs, [order._id]: e.target.value })}
                  />
                  <button 
                    onClick={() => handleAssociate(order._id)}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition"
                  >
                    <Link size={16} /> Assign
                  </button>
                </div>

              </div>
            ))}
          </div>
        )}
        
        {/* Helper Note */}
        <div className="mt-8 bg-blue-50 text-blue-800 p-4 rounded-lg flex items-start gap-3 text-sm">
          <AlertCircle size={20} className="shrink-0" />
          <p>
            <strong>Note for Testing:</strong> Since we don't have a "List All Users" API yet, you must manually copy a valid <code>_id</code> from a Buyer (from Postman or MongoDB) and paste it above to link them.
          </p>
        </div>

      </div>
    </div>
  );
};

export default AdminDashboard;