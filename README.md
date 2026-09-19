# 🏥 MediChain

### Resilient & Intelligent Pharmaceutical Supply Chain Management

MediChain is a full-stack healthcare supply-chain platform designed to connect **pharmaceutical suppliers, warehouses, distributors, transportation providers, and pharmacies** through a centralized and intelligent supply network.

The platform provides real-time inventory visibility, medicine tracking, order and shipment management, role-based access, alerts, and a foundation for AI-powered demand prediction and emergency redistribution.

---

## 🌐 Live Demo

**MediChain:**  
https://medichain-1-obe8.onrender.com

> The live application may require an account to access the MediChain dashboard.

---

## 🚀 Key Features

### 📦 Inventory Management
- Real-time medicine inventory tracking
- Medicine records and batch information
- Stock quantity monitoring
- Reorder-level tracking
- Low-stock identification

### 🚚 Shipment & Transportation Tracking
- Shipment creation and monitoring
- Shipment status tracking
- Origin and destination management
- Delivery visibility across the supply network

### 🛒 Order Management
- Create and manage medicine orders
- Track order status
- Connect orders with inventory and shipments

### 👥 Role-Based Access
MediChain supports different supply-chain stakeholders, including:

- Administrators
- Suppliers
- Warehouses
- Distributors
- Transportation providers
- Pharmacies

Access to functionality is controlled according to the user's role.

### 🔐 Authentication & Security
- User registration and login
- JWT-based authentication
- Password hashing
- Protected API routes
- Role-based authorization

### 📊 Dashboard & Analytics
The dashboard provides a centralized view of:

- Inventory levels
- Orders
- Active shipments
- At-risk inventory
- Network health
- Alerts
- Operational activity

### 🚨 Alerts & Risk Monitoring
MediChain provides monitoring for operational issues such as:

- Low stock
- Inventory risks
- Shipment issues
- Supply-chain alerts

---

## 🧠 AI/ML Roadmap

MediChain is designed to incorporate intelligent supply-chain capabilities.

Planned AI/ML functionality includes:

- Medicine demand prediction
- Inventory forecasting
- Stockout prediction
- Emergency redistribution recommendations
- Supply-chain risk prediction
- Anomaly detection
- Intelligent alerts

The AI/ML components are being developed separately within the project's `ai-ml` branch.

---

## 🏗️ System Architecture

```text
                    ┌─────────────────────┐
                    │     MediChain UI    │
                    │   HTML / CSS / JS   │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │   Express.js API    │
                    │    Node.js Backend  │
                    └──────────┬──────────┘
                               │
              ┌────────────────┼────────────────┐
              │                │                │
              ▼                ▼                ▼
        Authentication     REST APIs        Business Logic
          JWT / RBAC       CRUD Routes       Supply Chain
              │                │                │
              └────────────────┼────────────────┘
                               ▼
                    ┌─────────────────────┐
                    │      MongoDB        │
                    │    Database Layer   │
                    └─────────────────────┘


🛠️ Technology Stack
Frontend
HTML5
CSS3
JavaScript
REST API integration
Backend
Node.js
Express.js
JWT
bcrypt
Mongoose
Database
MongoDB
AI / ML
Python
Machine Learning
Data analysis & forecasting
Deployment
Render
MongoDB Atlas
📁 Project Structure
MEDICHAIN/
│
├── backend/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── utils/
│   ├── server.js
│   └── package.json
│
├── ai-ml/
│
├── app.js
├── index.html
├── login.html
├── styles.css
├── README.md
└── .gitignore
⚙️ Running MediChain Locally
1. Clone the repository
git clone https://github.com/prathamsaini2786-alt/MEDICHAIN.git
cd MEDICHAIN
2. Install backend dependencies
cd backend
npm install
3. Configure environment variables

Create a .env file inside backend/:

MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
PORT=5001
4. Start the backend
npm start

The backend will run locally on:

http://localhost:5001
5. Run the frontend

Open the frontend using VS Code Live Server or another static web server.

The frontend communicates with the deployed/local Express API depending on the configured API URL.

🔑 Authentication Flow
User
 │
 ▼
Login / Signup
 │
 ▼
Express Authentication API
 │
 ▼
Password Verification
 │
 ▼
JWT Token
 │
 ▼
Authenticated Session
 │
 ▼
Protected MediChain Dashboard

Existing users can log in and continue using their account, while new users can create accounts through the signup flow.

📡 Backend API

The backend provides REST APIs for core MediChain operations including:

/auth
/drugs
/medicines
/inventory
/orders
/shipments
/warehouses
/suppliers
/alerts
/analytics
/dashboard
/issue-reports
🔮 Future Development

Planned improvements include:

🤖 AI-based demand forecasting
🚨 Automated emergency stock redistribution
📈 Advanced supply-chain analytics
🧠 Predictive inventory management
🔗 Blockchain-based medicine traceability
📱 QR-based medicine identification
🛡️ Anti-theft and anomaly detection
🌐 Real-world pharmaceutical supply-chain data integration
🗺️ Live logistics and transportation tracking
🎯 Project Goal

MediChain aims to make pharmaceutical supply chains:

More visible.
More resilient.
More intelligent.
More secure.

By combining modern web technologies, centralized supply-chain management, and AI/ML capabilities, MediChain provides a foundation for smarter pharmaceutical distribution.