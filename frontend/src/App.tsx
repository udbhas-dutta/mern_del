import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import { socket } from "./services/socket";
import { useEffect } from "react";
import SellerDashboard from "./pages/SellerDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import BuyerDashboard from "./pages/BuyerDashboard";
import ProtectedRoute from "./components/ProtectedRoute";


function App() {
  // Testing websocket connection
  useEffect(() => {
    socket.connect();

    socket.on("connect", () => {
      console.log("✅ WEBSOCKET CONNECTED:", socket.id);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Route */}
        <Route path="/login" element={<Login />} />

        {/* Protected Dashboard Routes */}

        <Route path="/buyer" element={
            <ProtectedRoute allowedRoles={['Buyer']}>
              <BuyerDashboard />
            </ProtectedRoute>
          } />

        <Route path="/seller" element={
            <ProtectedRoute allowedRoles={['Seller']}>
              <SellerDashboard />
            </ProtectedRoute>
          } />

        <Route path="/admin" element={
            <ProtectedRoute allowedRoles={['Admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          } />
        {/* Redirect unknown paths to Login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
