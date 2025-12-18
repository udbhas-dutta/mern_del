import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';
import type { RootState } from '../app/store';
import { setOrders, updateOrderRealTime } from '../features/orderSlice'; // Note: Ensure this path is correct
import { socket } from '../services/socket';
import { LogOut, Users, Briefcase, Clock, Activity, FileText, X } from 'lucide-react';
import { logout } from '../features/authSlice';
import { useNavigate } from 'react-router-dom';

interface ErrorResponse {
  message: string;
}

interface UserData {
  _id: string;
  name: string;
  email: string;
  role: string;
}

const AdminDashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { token } = useSelector((state: RootState) => state.auth);
  const { orders } = useSelector((state: RootState) => state.orders);

  // 1. DEFINE API URL
  const API_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

  // Selection States
  const [buyerSelections, setBuyerSelections] = useState<{ [key: string]: string }>({});
  const [sellerSelections, setSellerSelections] = useState<{ [key: string]: string }>({});
  
  // Data Lists
  const [allUsers, setAllUsers] = useState<UserData[]>([]);
    //eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);

  useEffect(() => {
    // 1. Fetch Orders
    const fetchOrders = async () => {
      try {
        // 2. USE API_URL
        const res = await axios.get(`${API_URL}/api/orders`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        dispatch(setOrders(res.data));
      } catch (err) {
        console.error("Failed to fetch orders", err);
      }
    };

    // 2. Fetch Users (To populate Dropdowns)
    const fetchUsers = async () => {
      try {
        // 3. USE API_URL
        const res = await axios.get(`${API_URL}/api/auth/users`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setAllUsers(res.data);
      } catch (err) {
        console.error("Failed to fetch users.", err);
      }
    };

    fetchOrders();
    fetchUsers();

    // 3. Real-time Listeners
    socket.on('order_updated', (updatedOrder) => dispatch(updateOrderRealTime(updatedOrder)));
    socket.on('order_created', (newOrder) => dispatch(updateOrderRealTime(newOrder)));

    return () => {
      socket.off('order_updated');
      socket.off('order_created');
    };
  }, [dispatch, token, API_URL]);

  const handleAssignSeller = async (orderId: string) => {
    const sellerId = sellerSelections[orderId];
    if (!sellerId) return alert("Please select a Seller from the list");

    try {
      // 4. USE API_URL
      const res = await axios.put(`${API_URL}/api/orders/assign-seller`, 
        { orderId, sellerId }, 
        { headers: { Authorization: `Bearer ${token}` }}
      );
      setSellerSelections(prev => ({ ...prev, [orderId]: '' }));
      dispatch(updateOrderRealTime(res.data));
      alert("Seller Assigned Successfully!");
    } catch (err) {
      handleError(err);
    }
  };

  const handleAssociateBuyer = async (orderId: string) => {
    const buyerId = buyerSelections[orderId];
    if (!buyerId) return alert("Please select a Buyer from the list");

    try {
      // 5. USE API_URL
      const res = await axios.put(`${API_URL}/api/orders/associate`, 
        { orderId, buyerId }, 
        { headers: { Authorization: `Bearer ${token}` }}
      );
      setBuyerSelections(prev => ({ ...prev, [orderId]: '' }));
      dispatch(updateOrderRealTime(res.data));
      alert("Buyer Associated Successfully!");
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

  // --- HELPERS FOR SAFE DATA ACCESS ---
  // Fixes the crash by extracting the string ID whether it's an object or string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const getUserId = (userOrId: any): string => {
    if (!userOrId) return '';
    return typeof userOrId === 'string' ? userOrId : userOrId._id;
  };

  // Safe User Lookup
  //eslint-disable-next-line @typescript-eslint/no-explicit-any
  const getUser = (userOrId: any) => {
    const id = getUserId(userOrId);
    if (!id) return undefined;
    return allUsers.find(u => u._id === id);
  };

  const sellers = allUsers.filter(u => u.role === 'Seller');
  const buyers = allUsers.filter(u => u.role === 'Buyer');

  // --- Stats ---
  const totalOrders = orders.length;
  const completedOrders = orders.filter(o => o.stage === 'Delivered').length;
  const activeOrders = totalOrders - completedOrders;

  // --- Filtered Lists ---
  // Safe filtering using the new getUserId helper
  const ordersNeedingSeller = orders.filter(o => !getUserId(o.sellerId));
  const ordersNeedingBuyer = orders.filter(o => o.stage === 'Order Placed');

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8 bg-white p-4 rounded-lg shadow-sm">
        <h1 className="text-2xl font-bold text-gray-800">Admin Dashboard</h1>
        <div className="flex items-center gap-4">
          <span className="text-purple-600 font-medium bg-purple-100 px-3 py-1 rounded-full">Admin Access</span>
          <button onClick={handleLogout} className="text-red-600 font-medium flex gap-2"><LogOut size={20} /> Logout</button>
        </div>
      </div>

      {/* STATS */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="p-3 bg-purple-100 text-purple-600 rounded-lg"><Activity size={24} /></div>
          <div><p className="text-gray-500 text-sm">Total Orders</p><h3 className="text-2xl font-bold">{totalOrders}</h3></div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-lg"><Clock size={24} /></div>
          <div><p className="text-gray-500 text-sm">Active Now</p><h3 className="text-2xl font-bold">{activeOrders}</h3></div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="p-3 bg-green-100 text-green-600 rounded-lg"><FileText size={24} /></div>
          <div><p className="text-gray-500 text-sm">Completed</p><h3 className="text-2xl font-bold">{completedOrders}</h3></div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* SECTION 1: Associate Buyers */}
        <div>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-blue-600">
            <Users /> 1. Associate Buyer
          </h2>
          {ordersNeedingBuyer.length === 0 ? (
            <div className="bg-white p-6 rounded-lg border border-dashed text-center text-gray-400">
              No orders waiting for buyer association.
            </div>
          ) : (
            <div className="space-y-3">
              {ordersNeedingBuyer.map((order) => {
                const creator = getUser(order.buyerId); 
                return (
                  <div key={order._id} className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-blue-500 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div>
                      <p className="font-bold text-gray-800">{order.items.join(", ")}</p>
                      {/* FIX: Use getUserId to render ID string, not object */}
                      <p className="text-xs text-gray-500">
                        Created by: {creator ? creator.name : 'Unknown'} 
                        <span className="font-mono ml-1">(ID: {getUserId(order.buyerId)})</span>
                      </p>
                    </div>
                    <div className="flex gap-2 w-full md:w-auto">
                      <select 
                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none w-full md:w-64"
                        value={buyerSelections[order._id] || ''}
                        onChange={e => setBuyerSelections({...buyerSelections, [order._id]: e.target.value})}
                      >
                        <option value="">-- Select Buyer --</option>
                        {buyers.map(buyer => (
                          <option key={buyer._id} value={buyer._id}>
                            {buyer.name} ({buyer.email})
                          </option>
                        ))}
                      </select>
                      <button onClick={() => handleAssociateBuyer(order._id)} className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600 whitespace-nowrap">
                        Link Buyer
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* SECTION 2: Assign Sellers */}
        <div>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-orange-600">
            <Briefcase /> 2. Assign Sellers
          </h2>
          {ordersNeedingSeller.length === 0 ? (
            <div className="bg-white p-6 rounded-lg border border-dashed text-center text-gray-400">
              No orders pending seller assignment.
            </div>
          ) : (
            <div className="space-y-3">
              {ordersNeedingSeller.map((order) => (
                <div key={order._id} className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-orange-500 flex flex-col md:flex-row justify-between items-center gap-4">
                  <div>
                    <p className="font-bold text-gray-800">{order.items.join(", ")}</p>
                    <p className="text-xs text-gray-500">Status: {order.stage}</p>
                  </div>
                  
                  <div className="flex gap-2 items-center w-full md:w-auto">
                    <select 
                      className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-orange-500 outline-none w-full md:w-64"
                      value={sellerSelections[order._id] || ''}
                      onChange={e => setSellerSelections({...sellerSelections, [order._id]: e.target.value})}
                    >
                      <option value="">-- Select Seller --</option>
                      {sellers.map(seller => (
                        <option key={seller._id} value={seller._id}>
                          {seller.name} ({seller.email})
                        </option>
                      ))}
                    </select>

                    <button 
                      onClick={() => handleAssignSeller(order._id)} 
                      className="bg-orange-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-600 transition"
                    >
                      Assign
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* SECTION 3: ALL ORDERS TABLE */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">All System Orders</h2>
          <div className="bg-white rounded-lg shadow-sm overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                <tr>
                  <th className="p-4">Order ID</th>
                  <th className="p-4">Current Stage</th>
                  <th className="p-4">Buyer Details</th>
                  <th className="p-4">Seller Details</th>
                  <th className="p-4">Items</th>
                  <th className="p-4">Timestamps</th>
                  <th className="p-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {orders.map(order => {
                  const buyer = getUser(order.buyerId);
                  const seller = getUser(order.sellerId);
                  
                  return (
                    <tr key={order._id} className="hover:bg-gray-50">
                      <td className="p-4 font-mono text-gray-600">#{order._id.slice(-6)}</td>
                      
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                          order.stage === 'Delivered' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                        }`}>
                          {order.stage}
                        </span>
                      </td>

                      <td className="p-4">
                        {buyer ? (
                          <div>
                            <p className="font-bold text-gray-800">{buyer.name}</p>
                            <p className="text-xs text-gray-500">{buyer.email}</p>
                            {/* FIX: Safe ID render */}
                            <p className="text-[10px] text-gray-400 font-mono">{buyer._id}</p>
                          </div>
                        ) : <span className="text-gray-400">Unassigned</span>}
                      </td>

                      <td className="p-4">
                        {seller ? (
                          <div>
                            <p className="font-bold text-gray-800">{seller.name}</p>
                            <p className="text-xs text-gray-500">{seller.email}</p>
                            {/* FIX: Safe ID render */}
                            <p className="text-[10px] text-gray-400 font-mono">{seller._id}</p>
                          </div>
                        ) : <span className="text-orange-500 text-xs font-bold">Needs Assignment</span>}
                      </td>

                      <td className="p-4 font-medium text-gray-700">{order.items.join(", ")}</td>
                      
                      <td className="p-4 text-xs text-gray-500">
                        <p>Created: {new Date(order.createdAt).toLocaleDateString()}</p>
                        <p>Updated: {new Date(order.updatedAt).toLocaleTimeString()}</p>
                      </td>

                      <td className="p-4">
                        <button 
                          onClick={() => setSelectedOrder(order)}
                          className="text-blue-600 hover:underline text-xs font-bold"
                        >
                          View Logs
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* DETAILS MODAL */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="bg-gray-50 p-4 border-b flex justify-between items-center">
              <h3 className="font-bold text-lg">Order Details #{selectedOrder._id.slice(-6)}</h3>
              <button onClick={() => setSelectedOrder(null)}><X size={20} className="text-gray-500 hover:text-black" /></button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Buyer</span> 
                  {/* FIX: Safe Lookup */}
                  <p className="font-bold">{getUser(selectedOrder.buyerId)?.name || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-gray-500">Seller</span> 
                  {/* FIX: Safe Lookup */}
                  <p className="font-bold">{getUser(selectedOrder.sellerId)?.name || 'Unassigned'}</p>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-bold mb-3 text-sm uppercase text-gray-500">Activity Log</h4>
                <div className="space-y-3 relative before:absolute before:left-2 before:top-2 before:h-full before:w-0.5 before:bg-gray-200">
                  {
                    //eslint-disable-next-line @typescript-eslint/no-explicit-any
                    selectedOrder.stageHistory?.map((log: any, index: number) => (
                    <div key={index} className="relative flex items-center gap-4 pl-6">
                      <div className="absolute left-0 w-4 h-4 bg-purple-600 rounded-full border-4 border-white"></div>
                      <div>
                        <p className="font-bold text-sm text-gray-800">{log.stage}</p>
                        <p className="text-xs text-gray-500">{new Date(log.timestamp).toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;