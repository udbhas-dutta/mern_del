import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Route */}
        <Route path="/login" element={<Login />} />

        {/* Protected Dashboard Routes (Placeholders for now) */}
        <Route 
          path="/buyer" 
          element={
            <div className="min-h-screen bg-gray-50 p-8">
              <h1 className="text-3xl font-bold text-blue-600">Buyer Dashboard</h1>
              <p className="mt-2 text-gray-600">Work in progress...</p>
            </div>
          } 
        />
        
        <Route 
          path="/seller" 
          element={
            <div className="min-h-screen bg-gray-50 p-8">
              <h1 className="text-3xl font-bold text-green-600">Seller Dashboard</h1>
              <p className="mt-2 text-gray-600">Work in progress...</p>
            </div>
          } 
        />
        
        <Route 
          path="/admin" 
          element={
            <div className="min-h-screen bg-gray-50 p-8">
              <h1 className="text-3xl font-bold text-purple-600">Admin Dashboard</h1>
              <p className="mt-2 text-gray-600">Work in progress...</p>
            </div>
          } 
        />

        {/* Redirect unknown paths to Login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;