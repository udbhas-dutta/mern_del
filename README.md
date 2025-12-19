# 🚚 Logistics Delivery Management System

A full-stack **MERN** application for managing logistics operations in real-time. This system facilitates a complete delivery workflow where Admins coordinate orders, Sellers update tracking statuses, and Buyers track their packages live.

🔗  **Live Demo:** [https://mern-logistics-frontend.onrender.com](https://mern-logistics-frontend.onrender.com)

🎥 **Short Video Link:** https://drive.google.com/file/d/1Q2DiazriymH6w7nlYivkS5cOcPbpoFHD/view?usp=sharing

## ✨ Key Features

- **Real-Time Tracking:** Instant updates across all dashboards using **Socket.io**. When a Seller updates a stage (e.g., "Shipped"), the Buyer sees it immediately without refreshing.
- **Role-Based Access Control (RBAC):**
  - **👨‍💼 Admin:** The command center. Admins can view all orders, assign Sellers to shipments, and link Buyers to specific orders.
  - **📦 Seller:** Dedicated dashboard to view assigned tasks and update delivery stages (Processing → Packed → Shipped → Out for Delivery → Delivered).
  - **🛒 Buyer:** User-friendly interface to place order requests and track the progress of their deliveries via a visual progress bar.
- **Secure Authentication:** JWT (JSON Web Token) based login and registration system.
- **Responsive UI:** Modern, clean interface built with React, Tailwind CSS, and Lucide Icons.

## 📦 Delivery Workflow

Each order progresses through **7 fixed stages**, strictly in one direction:

1. Order Placed  
2. Buyer Associated  
3. Processing  
4. Packed  
5. Shipped  
6. Out for Delivery  
7. Delivered  

- Orders can only move forward **one stage at a time**
- No skipping or reversing stages
- Each stage change is timestamped and logged

### 👨‍💼 Admin Capabilities
- View all orders in real time
- Associate Buyers to orders (automatically moves stage to *Buyer Associated*)
- View detailed order analytics:
  - Time spent in each delivery stage
  - Order creation time
  - Full action/event log (who did what, and when)

### 🛒 Buyer Rules
- Buyers can have only **one active order** at a time
- An active order is one that is not delivered or deleted
- Buyers cannot associate themselves with orders; this action is restricted to Admins

## 🔴 Real-Time Updates

All dashboards update automatically using WebSockets (Socket.io) when:
- A new order is created
- An order stage changes
- A Buyer is associated
- An order is deleted

No manual refresh or polling is used.

## 🗑️ Order Deletion

Orders are **hard-deleted** from the database when a Seller deletes them.
(This choice was made to keep the system simple and avoid clutter from inactive orders.)

## 🛠️ Tech Stack

- **Frontend:** React.js, Vite, Redux Toolkit (State Management), Tailwind CSS
- **Backend:** Node.js, Express.js
- **Database:** MongoDB Atlas (Cloud)
- **Real-Time Communication:** Socket.io
- **Deployment:** Render (Web Service for Backend & Static Site for Frontend)

---

## 🚀 Getting Started Locally

Follow these steps to run the project on your local machine.

### Prerequisites
- Node.js (v18 or higher)
- MongoDB Compass (or a Mongo Atlas connection string)

### 1. Clone the Repository
```bash
git clone https://github.com/udbhas-dutta/mern_del.git
cd mern_del 
```

### 2. Backend Setup
Navigate to the `backend` folder and install dependencies:
```bash
cd backend
npm install
```
Create a `.env` file in the `backend` and add the following:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=any_secret_key_you_choose
```

Start the backend server:
```bash
npm start
```

You should see "✅ MongoDB Connected" and "🚀 Server running on port 5000"

### 3. Frontend Setup
Open a new terminal, navigate to the `frontend` folder, and install dependencies:
```bash
cd frontend
npm install
```
Create a `.env.local` file in the `frontend` folder to point to your local backend:
```env
VITE_SOCKET_URL=http://localhost:5000
```

Start the frontend development server:
```bash
npm run dev
```

### Default Credentials (for testing)

Buyer: buyer@test.com  
Seller: seller@test.com  
Admin: admin@test.com  

Password: `123`


