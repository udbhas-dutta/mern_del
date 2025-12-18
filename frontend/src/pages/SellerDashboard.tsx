import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import axios, {  } from 'axios';
import type { RootState } from '../app/store';
// ADD: removeOrder import
import { setOrders, updateOrderRealTime, removeOrder } from '../features/orderSlice';
import { socket } from '../services/socket';
// ADD: Trash2 icon
import { LogOut, Package, Truck, CheckCircle, Trash2 } from 'lucide-react';
import { logout } from '../features/authSlice';
import { useNavigate } from 'react-router-dom';

interface ErrorResponse {
  message: string;
}

const SellerDashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, token } = useSelector((state: RootState) => state.auth);
  const { orders } = useSelector((state: RootState) => state.orders);

  useEffect(() => {
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

    socket.on('order_updated', (updatedOrder) => dispatch(updateOrderRealTime(updatedOrder)));
    socket.on('order_created', (newOrder) => dispatch(updateOrderRealTime(newOrder)));
    
    // Listen for deletions
    socket.on('order_deleted', (deletedId) => {
      dispatch(removeOrder(deletedId));
    });

    return () => {
      socket.off('order_updated');
      socket.off('order_created');
      socket.off('order_deleted');
    };
  }, [dispatch, token]);

  const handleNextStage = async (orderId: string) => {
    try {
      const res = await axios.put(`http://localhost:5000/api/orders/${orderId}/stage`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      dispatch(updateOrderRealTime(res.data));
    } catch (err) {
      handleError(err);
    }
  };

  // Handle Delete
  const handleDelete = async (orderId: string) => {
    if (!window.confirm("Are you sure you want to delete this order?")) return;

    try {
      await axios.delete(`http://localhost:5000/api/orders/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Redux updates via socket, but we can do it locally for instant feel
      dispatch(removeOrder(orderId));
    } catch (err) {
      handleError(err);
    }
  };

  //eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleError = (err: any) => {
    let msg = "Error";
    if (axios.isAxiosError(err)) {
      const data = err.response?.data as ErrorResponse;
      msg = data?.message || err.message;
    }
    alert(msg);
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="flex justify-between items-center mb-8 bg-white p-4 rounded-lg shadow-sm">
        <h1 className="text-2xl font-bold text-gray-800">Seller Dashboard</h1>
        <div className="flex items-center gap-4">
          <span className="text-gray-600">Logged in as: {user?.name}</span>
          <button onClick={handleLogout} className="flex items-center gap-2 text-red-600 hover:text-red-700 font-medium">
            <LogOut size={20} /> Logout
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto">
        <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
          <Package className="text-blue-600" /> Active Orders Table
        </h2>

        {orders.length === 0 ? (
          <div className="text-center py-20 text-gray-500 bg-white rounded-lg border border-dashed">
            No orders assigned to you yet.
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm overflow-x-auto border border-gray-200">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase border-b border-gray-200">
                <tr>
                  <th className="p-4 font-semibold">Order ID</th>
                  <th className="p-4 font-semibold">Current Stage</th>
                  <th className="p-4 font-semibold">Items</th>
                  <th className="p-4 font-semibold">Buyer Details</th>
                  <th className="p-4 font-semibold">Timestamps</th>
                  <th className="p-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                {orders.map((order) => {
                  // Helper to safely access buyer data if populated, or fallback to ID
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  const buyer: any = order.buyerId; 
                  const buyerName = buyer?.name || 'N/A';
                  const buyerEmail = buyer?.email || 'N/A';
                  const buyerIdStr = buyer?._id || buyer || 'Unknown';

                  // 🟢 FIX: Handle dates safely without Date.now() fallback
                  const createdDate = order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'N/A';
                  const updatedTime = order.updatedAt ? new Date(order.updatedAt).toLocaleTimeString() : 'N/A';

                  return (
                    <tr key={order._id} className="hover:bg-gray-50 transition-colors">
                      {/* Order ID */}
                      <td className="p-4 font-mono text-xs text-gray-500">
                        #{order._id.slice(-6)}
                      </td>

                      {/* Current Stage */}
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold whitespace-nowrap
                          ${order.stage === 'Delivered' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}
                        `}>
                          {order.stage}
                        </span>
                      </td>

                      {/* Items */}
                      <td className="p-4">
                        <div className="flex flex-wrap gap-1">
                          {order.items.map((item, i) => (
                            <span key={i} className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs border border-gray-200">
                              {item}
                            </span>
                          ))}
                        </div>
                      </td>

                      {/* Buyer Name, ID, Email */}
                      <td className="p-4">
                        <div className="flex flex-col">
                          <span className="font-semibold text-gray-900">{buyerName}</span>
                          <span className="text-xs text-blue-600">{buyerEmail}</span>
                          <span className="text-[10px] text-gray-400 font-mono mt-0.5">ID: {buyerIdStr}</span>
                        </div>
                      </td>

                      {/* Created At / Updated At */}
                      <td className="p-4 text-xs text-gray-500">
                        <div className="flex flex-col gap-1">
                          <span title="Created At">📅 {createdDate}</span>
                          <span title="Last Updated">🕒 {updatedTime}</span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="p-4">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => handleNextStage(order._id)}
                            disabled={order.stage === 'Delivered'}
                            className={`flex items-center gap-1 px-3 py-1.5 rounded text-xs font-medium transition
                              ${order.stage === 'Delivered' 
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                                : 'bg-black text-white hover:bg-gray-800'}
                            `}
                          >
                             {order.stage === 'Delivered' ? <CheckCircle size={14}/> : <Truck size={14}/>}
                             {order.stage === 'Delivered' ? 'Done' : 'Next'}
                          </button>

                          <button 
                            onClick={() => handleDelete(order._id)}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded border border-transparent hover:border-red-100 transition"
                            title="Delete Order"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default SellerDashboard;