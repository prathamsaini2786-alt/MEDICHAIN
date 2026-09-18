# MediChain

MediChain is a full-stack healthcare medicine supply-chain management platform for managing inventory, orders, shipments, suppliers, facilities, stock movements, alerts, analytics, and role-based operations.

## 🌐 Live Demo

**https://medichain-nuaz.onrender.com**

## ✨ Features

- JWT authentication and protected APIs
- Role-based access control
- Medicine Master
- Inventory management
- Order management and status workflows
- Shipment tracking
- Facility and warehouse management
- Inter-facility stock transfers
- Automated inventory alerts
- Analytics dashboard
- Global search
- User profile and workspace settings
- Notification preferences
- CSV inventory export
- Toast notifications

## 👥 User Roles

| Role | Responsibilities |
|---|---|
| Admin | Full system administration |
| Supplier | Medicine and inventory operations |
| Distributor | Facilities, shipments and stock movement |
| Pharmacy | Order and pharmacy-side operations |

Role permissions are enforced by the backend API as well as the frontend interface.

## 🏗️ Architecture

```text
MediChain
│
├── Frontend
│   ├── HTML5
│   ├── CSS3
│   └── JavaScript
│
└── Backend
    ├── Node.js
    ├── Express.js
    ├── MongoDB
    ├── Mongoose
    └── JWT Authentication
