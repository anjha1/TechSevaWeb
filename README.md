# TechSeva - Appliance Repair Service Platform

A full-stack web application for managing home appliance repair services with multiple user roles, technician management, job scheduling, and payment processing.

## 🚀 Features

- **Multi-Role Authentication**: Customer, Technician, SuperAdmin, CityManager, ServiceAdmin, FinanceOfficer, SupportAgent
- **Job Management**: Book, track, and manage appliance repair jobs
- **Technician KYC**: Document verification for technicians
- **Payment Processing**: Commission calculation, GST handling, technician payouts
- **Support System**: Ticket management for customer support
- **Email Notifications**: OTP verification, job updates, admin credentials

## 📁 Project Structure

```
Tech_Seva/
├── backend/                    # Modular Express.js backend
│   ├── config/                 # Environment & database config
│   │   ├── env.js
│   │   └── db.js
│   ├── models/                 # Mongoose schemas (11 models)
│   ├── controllers/            # Business logic
│   ├── routes/                 # API routes
│   ├── middlewares/            # Auth & error handling
│   ├── services/               # Email, OTP, Payment services
│   ├── utils/                  # Logger, response helpers
│   ├── app.js                  # Express configuration
│   └── server.js               # Entry point (~30 lines)
│
├── frontend/src/               # React SPA
│   ├── context/                # AuthContext
│   ├── services/               # API client (Axios)
│   ├── layouts/                # Public & Dashboard layouts
│   ├── pages/                  # Page components
│   │   └── dashboards/         # Role-specific dashboards
│   └── styles/                 # CSS
│
├── public/                     # Static assets
├── views/                      # Legacy HTML (preserved)
├── server.js                   # Original monolithic server (backup)
└── docker-compose.yml          # Docker orchestration
```

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Backend | Node.js, Express.js |
| Database | MongoDB, Mongoose |
| Frontend | React 19, React Router |
| Auth | Express Sessions, bcryptjs, Google OAuth |
| Email | Nodemailer (Gmail SMTP) |
| Deployment | Docker, PM2 |

## ⚡ Quick Start

### Prerequisites

- Node.js 18+
- MongoDB 6+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/anjha1/techseva.git
cd techseva

# Install dependencies
npm install

# Create environment file
cp .env.example .env
# Edit .env with your configuration

# Start development server
npm run dev
```

### Docker Setup

```bash
# Start with Docker Compose
docker-compose up -d

# View logs
docker-compose logs -f app
```

## 🔧 Available Scripts

| Script | Description |
|--------|-------------|
| `npm start` | Start production server |
| `npm run dev` | Start with nodemon (hot reload) |
| `npm run dev:legacy` | Run original server.js |
| `npm run build` | Build React frontend |

## 📡 API Endpoints

### Authentication
```
POST /api/auth/send-otp      # Send OTP for signup/reset
POST /api/auth/verify-otp    # Verify OTP
POST /api/auth/register      # User registration
POST /api/auth/login         # User login
POST /api/auth/google-login  # Google OAuth login
POST /api/auth/reset-password
POST /api/auth/logout
```

### User
```
GET  /api/user/me            # Get current user
PUT  /api/user/profile       # Update profile
POST /api/user/book          # Book a service
GET  /api/user/jobs          # Get user's jobs
POST /api/user/jobs/cancel
POST /api/user/jobs/review
```

### Technician
```
GET  /api/technician/jobs
POST /api/technician/jobs/accept
POST /api/technician/jobs/start
POST /api/technician/jobs/complete
POST /api/technician/jobs/diagnosis
PUT  /api/technician/availability
POST /api/technician/withdraw
```

### Admin
```
GET  /api/admin/dashboard
GET  /api/admin/users
POST /api/admin/kyc/approve/:userId
GET  /api/admin/jobs
POST /api/admin/jobs/assign
GET  /api/admin/appliances
GET  /api/admin/locations
GET  /api/admin/tickets
GET  /api/admin/transactions
```

## 👥 User Roles

| Role | Permissions |
|------|-------------|
| **user** | Book services, track jobs, submit reviews |
| **technician** | Accept jobs, diagnose, complete repairs |
| **Superadmin** | Full system access |
| **Citymanager** | Manage users/jobs in assigned cities |
| **Serviceadmin** | Manage specific appliance categories |
| **Financeofficer** | View transactions, process payouts |
| **Supportagent** | Handle tickets & customer inquiries |

## 🔐 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `PORT` | Server port (default: 5000) | No |
| `MONGODB_URI` | MongoDB connection string | Yes |
| `SESSION_SECRET` | Session encryption key | Yes |
| `EMAIL_USER` | Gmail address for SMTP | Yes |
| `EMAIL_PASS` | Gmail app password | Yes |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | No |

## 🐳 Docker Commands

```bash
# Build and start
docker-compose up -d --build

# Stop services
docker-compose down

# View logs
docker-compose logs -f

# Access MongoDB shell
docker exec -it techseva-mongo mongosh
```

## 📊 Business Logic

- **Commission Rate**: 10% of job amount
- **Tax Rate (GST)**: 18%
- **Technician Earnings**: Total - Commission - Tax

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 📞 Support

For support, email support@techseva.com or create an issue in the repository.

---

Made with ❤️ by TechSeva Team
