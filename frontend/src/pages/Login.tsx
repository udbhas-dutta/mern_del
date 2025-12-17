import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { setCredentials } from '../features/authSlice';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { socket } from '../services/socket';

const Login = () => {
  const [isRegister, setIsRegister] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'Buyer' });
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login';
    
    try {
      // In dev, we use full URL or setup proxy. Let's use full URL for simplicity now.
      const res = await axios.post(`http://localhost:5000${endpoint}`, formData);
      
      if (!isRegister) {
        const { user, token } = res.data;
        dispatch(setCredentials({ user, token }));
        
        // Connect Socket & Join Role Room
        socket.connect();
        socket.emit('join_room', user.role); // e.g. "Buyer", "Seller"
        if (user.role === 'Seller') socket.emit('join_room', user.id); // Seller needs specific room for their orders
        
        // Redirect based on role
        if (user.role === 'Admin') navigate('/admin');
        else if (user.role === 'Seller') navigate('/seller');
        else navigate('/buyer');
      } else {
        alert("Registration Successful! Please Login.");
        setIsRegister(false);
      }
    } catch (err) {
        // eslint-disable-next-line
      alert("Error: " + (err as any).response?.data?.message || 'Something went wrong');
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-gray-100">
      <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-6 text-center">{isRegister ? 'Register' : 'Login'}</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <input 
              type="text" placeholder="Name" className="w-full p-2 border rounded"
              value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
              required 
            />
          )}
          
          <input 
            type="email" placeholder="Email" className="w-full p-2 border rounded"
            value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})}
            required 
          />
          
          <input 
            type="password" placeholder="Password" className="w-full p-2 border rounded"
            value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})}
            required 
          />

          {isRegister && (
            <select 
              className="w-full p-2 border rounded"
              value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}
            >
              <option value="Buyer">Buyer</option>
              <option value="Seller">Seller</option>
              <option value="Admin">Admin</option>
            </select>
          )}

          <button type="submit" className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700">
            {isRegister ? 'Register' : 'Login'}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-blue-500 cursor-pointer" onClick={() => setIsRegister(!isRegister)}>
          {isRegister ? 'Already have an account? Login' : 'Need an account? Register'}
        </p>
      </div>
    </div>
  );
};

export default Login;