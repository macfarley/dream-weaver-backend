# 🌙 DreamWeaver Backend 😴

![DreamWeaver Logo](./public/logo.png)

> *Sleep data storage and API for DreamWeaver frontend.*

---

![Screenshot of API in action](./public/screenshot.png)

---

## ✨ About the Project

This is the **backend** repository for DreamWeaver, providing a RESTful API built with **Node.js**, **Express**, and **MongoDB**. It handles user authentication, bedroom environment data, sleep session tracking, dream journaling, and administrative management.

---

## ✨ Features

- 🔐 **Secure Authentication**: JWT-based auth with role-based authorization (User/Admin)
- 🛏️ **Bedroom Management**: CRUD operations for bedroom environments linked to users
- 🌛 **Sleep Tracking**: Complete sleep session lifecycle with detailed data collection
- 👤 **User Profiles**: Profile management with preferences and personal information
- 🛠️ **Admin Dashboard**: Comprehensive admin tools for user and system management
- 📅 **Date/Time Handling**: Flexible date queries and timezone support
- 🔒 **Security Features**: Password hashing, ownership validation, and admin safeguards
- 🌙 **Dream Journaling**: Sleep thoughts and session notes with wake-up tracking

---

## 🛠️ Tech Stack

- 🟢 **Node.js** with Express.js framework
- 🍃 **MongoDB** with Mongoose ODM
- 🔐 **JWT** for secure authentication
- 🔑 **Bcrypt** for password hashing
- 🛡️ **Helmet** for security headers
- 🌐 **CORS** for cross-origin requests
- 📝 **Morgan** for request logging
- 🔧 **Dotenv** for environment variables

---

## 📂 Project Structure

```
dream-weaver-backend/
├── controllers/           # API route handlers
│   ├── admin.js          # Admin user management
│   ├── auth.js           # Authentication (signup/signin)
│   ├── bedrooms.js       # Bedroom CRUD operations
│   ├── goToBed.js        # Sleep session management
│   ├── sleepData.js      # Sleep data tracking
│   └── users.js          # User profile management
├── middleware/           # Express middleware
│   ├── requireAdmin.js   # Admin role verification
│   └── verifyToken.js    # JWT token validation
├── models/              # MongoDB schemas
│   ├── Bedroom.js       # Bedroom environment model
│   ├── SleepData.js     # Sleep session model
│   └── User.js          # User account model
├── scripts/             # Utility scripts
│   └── seed.js          # Database seeding script
├── utils/                # Utility modules
│   └── jwt.js            # Centralized JWT creation/verification
├── .env.example         # Environment template
├── .gitignore          # Git ignore rules
├── package.json        # Dependencies and scripts
├── README.md           # This file
└── server.js           # Main application entry point
```

---

## 🚨 Troubleshooting

### Common Issues

**🔌 Database Connection Failed**
```bash
# Error: MONGODB_URI not set
# Solution: Check your .env file has MONGODB_URI set correctly

# Error: MongoNetworkError  
# Solution: Verify MongoDB is running (local) or connection string is correct (Atlas)
```

**🔐 JWT Token Issues**
```bash
# Error: JWT_SECRET not set
# Solution: Add JWT_SECRET to .env file with a secure random string

# Generate a secure JWT secret:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**👤 Admin User Not Found (Seeding)**
```bash
# Error: Admin user 'admin' not found
# Solution: Create admin user first via /auth/sign-up or update ADMIN_USERNAME in .env
```

**⚠️ Express Version Issues**
```bash
# Error: path-to-regexp TypeError
# Solution: This project uses Express 4.x (stable). If you see this error, check package.json
```

### Development Tips
- **Use nodemon**: `npm run dev` for auto-restart during development
- **Check logs**: Server logs show detailed error messages and connection status
- **Test endpoints**: Use Postman, curl, or the health endpoint for testing
- **Database GUI**: Use MongoDB Compass or Studio 3T to visualize your data

---

## 📦 Installation & Setup

### Prerequisites
- **Node.js** (v16 or higher)
- **MongoDB** database (local installation or MongoDB Atlas)
- **Git** for version control

### 1. Clone and Install
```bash
git clone https://github.com/macfarley/dream-weaver-backend.git
cd dream-weaver-backend
npm install
```

### 2. Environment Configuration
Create a `.env` file in the project root:

```ini
# Database Configuration
MONGODB_URI=mongodb://localhost:27017/dreamweaver
# For MongoDB Atlas: mongodb+srv://username:password@cluster.mongodb.net/dreamweaver

# Authentication
JWT_SECRET=your-super-secure-jwt-secret-key-change-this-in-production

# Server Configuration
PORT=3000
NODE_ENV=development

# Admin Configuration (for seeding)
ADMIN_USERNAME=admin
```

**⚠️ Security Note**: Never commit your actual `.env` file. Use `.env.example` as a template.

### 3. Database Setup

#### Option A: Create Admin User Manually
```bash
# First, start the server
npm run dev

# Then create an admin user via API:
curl -X POST http://localhost:3000/auth/sign-up \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "email": "admin@dreamweaver.com", 
    "password": "your-admin-password",
    "firstName": "Dream",
    "lastName": "Administrator"
  }'
```

#### Option B: Use Database Seeding (Recommended for Development)
```bash
# Ensure admin user exists first, then run:
npm run seed
```

**What the seed script creates:**
- 🎯 **Finds existing admin user** (set via `ADMIN_USERNAME` environment variable)
- 👥 **3 test users**: `dreamtester1`, `dreamtester2`, `sleepyuser` (password: `password123`)
- 🏠 **3 bedrooms per user** (master bedroom, reading nook, guest room)
- 💤 **30 days of sleep data per user** (realistic sleep patterns with wake-ups)
- ✅ **120 total sleep sessions** with dream journals and quality ratings

### 4. Start the Server
```bash
# Development mode (auto-restart on changes)
npm run dev

# Production mode
npm start
```

### 5. Verify Installation
- **Health Check**: http://localhost:3000/health
- **API Documentation**: See endpoints below
- **Database Connection**: Check console for MongoDB connection status

---

## 🗄️ Database Seeding

The seeding script creates comprehensive test data for development and testing:

### Running the Seed Script
```bash
# Method 1: NPM script
npm run seed

# Method 2: Direct execution  
node scripts/seed.js
```

### Seed Script Features
- **🔍 Smart User Detection**: Finds existing admin user, creates test users if missing
- **🧹 Data Cleanup**: Removes existing seed data before creating new data
- **📊 Realistic Data**: Uses Faker.js for diverse, realistic content
- **⏰ Historical Data**: Creates 30 days of backdated sleep sessions
- **🛡️ Safe Operation**: Only affects test users and admin user data

### Test User Credentials
After seeding, you can test with these accounts:
```
Username: dreamtester1  | Password: password123
Username: dreamtester2  | Password: password123  
Username: sleepyuser    | Password: password123
```

### Seed Data Structure
- **Users**: Admin + 3 test users with realistic profiles
- **Bedrooms**: 3 different bedroom types per user (12 total)
- **Sleep Sessions**: 30 entries per user spanning last 30 days (120 total)
- **Wake Events**: 1-3 wake-ups per session with quality ratings (average 1.9 per session)

### Environment Variables for Seeding
```ini
ADMIN_USERNAME=admin          # Username of admin user (must exist)
MONGODB_URI=your_db_url      # Database connection string
```

---

## 🆕 Changelog

### 2025-06-21
- Centralized all JWT creation/verification logic in `utils/jwt.js`.
- Refactored `controllers/auth.js` and `controllers/users.js` to use the new JWT utility.
- PATCH `/users/profile` now returns a new JWT after profile updates.
- Updated API docs and endpoint tables to clarify JWT refresh behavior.

---

## 🔐 JWT Utility Module

A new utility module at `utils/jwt.js` centralizes all JWT creation and verification logic. This ensures consistent token handling across authentication and user profile updates (including PATCH `/users/profile`).

- **generateToken(payload, expiresIn?)**: Create a signed JWT for a user or payload.
- **verifyToken(token)**: Validate and decode a JWT.

This utility is used in both the authentication controller and user profile update endpoint.

---

## 🧑‍💻 API Endpoints Overview

### 🔓 **Authentication Routes**
| Route | Method | Description | Auth Required |
|-------|---------|-------------|---------------|
| `/auth/sign-up` | POST | Create new user account | No |
| `/auth/sign-in` | POST | Login user and get JWT token | No |
| `/auth/login` | POST | Alias for sign-in (backward compatibility) | No |

### 👤 **User Routes**
| Route | Method | Description | Auth Required |
|-------|---------|-------------|---------------|
| `/users/profile` | GET | Get current user profile (never cached, always fresh) | Yes |
| `/users/profile` | PATCH | Update current user profile (partial, returns new JWT) | Yes |

> **Note:** `/users/profile` is never cached. The backend sets cache-control headers so you always get a fresh user object in the response.

### 🛏️ **Bedroom Routes**
| Route | Method | Description | Auth Required |
|-------|---------|-------------|---------------|
| `/bedrooms` | GET | List user bedrooms | Yes |
| `/bedrooms/new` | POST | Create new bedroom | Yes |
| `/bedrooms/by-name/:bedroomName` | GET | Get bedroom by name | Yes |
| `/bedrooms/:id` | GET | Get bedroom by ID | Yes |
| `/bedrooms/:id` | PUT | Update bedroom | Yes |
| `/bedrooms/:id` | DELETE | Delete bedroom | Yes |

### 🌙 **Sleep Data Routes**
| Route | Method | Description | Auth Required |
|-------|---------|-------------|---------------|
| `/sleep-data` | GET | Get all sleep sessions for user | Yes |
| `/sleep-data/:date` | GET | Get sleep session by date (YYYYMMDD) | Yes |
| `/sleep-data/:id` | PUT | Update sleep session | Yes |
| `/sleep-data/:id` | DELETE | Delete sleep session (requires password) | Yes |

### 🛌 **Go To Bed Routes**
| Route | Method | Description | Auth Required |
|-------|---------|-------------|---------------|
| `/gotobed` | POST | Start new sleep session | Yes |
| `/gotobed/active` | GET | Check for active session | Yes |
| `/gotobed/wakeup` | POST | Add wakeup data to session | Yes |

### 🛠️ **Admin Routes**
| Route | Method | Description | Auth Required |
|-------|---------|-------------|---------------|
| `/admin/users` | GET | List all users | Admin only |
| `/admin/users/:id` | GET | Get specific user details (admin or self) | Admin only |
| `/admin/users/:id` | PATCH | Partially update user (admin can update users, but cannot update other admins; admins can only self-update if target is admin). Username and role cannot be changed. Email must be unique. | Admin only |
| `/admin/users/:id` | DELETE | Delete user (admin only; requires admin password confirmation in `x-admin-password` header or body). Cannot delete other admins or self. Cascade deletes all user data (bedrooms, sleep data, etc). | Admin only |

> **Security Notes:**
> - All admin endpoints require valid JWT and admin role.
> - Admins cannot update or delete other admins (only self-update/delete allowed for admins).
> - Deletion requires admin password confirmation and performs full cascade deletion of user data.
> - All sensitive fields (password, role, username) are protected from unauthorized changes.
> - All actions are logged for audit purposes.

---

## 🔐 **Authentication & Security**

- **JWT Tokens**: Secure authentication with expiring tokens
- **Role-Based Access**: User and Admin roles with appropriate permissions  
- **Password Protection**: Bcrypt hashing with salt rounds
- **Ownership Validation**: Users can only access their own data
- **Admin Safeguards**: Admins cannot delete themselves or change other admin roles
- **Password Confirmation**: Required for sensitive operations like user deletion

---

## 📖 Usage Notes

- **JWT Tokens**: Tokens expire after 24 hours for enhanced security
- **User Data Protection**: Users can only modify their own data unless they have admin role
- **Sleep Session Tracking**: Comprehensive sleep data with bedroom environment, thoughts, and wake-up events
- **User Preferences**: Built-in user preferences system for personalization
- **Admin Management**: Full admin dashboard capabilities for user and system management
- **Date Handling**: Sleep data can be queried by date using YYYYMMDD format
- **Security First**: Password confirmation required for destructive operations

---

## 🏗️ **Models & Data Structure**

### User Model
- Username, email, password (hashed)
- First name, last name, date of birth
- Role (user/admin) and user preferences
- Linked to bedrooms and sleep data

### Bedroom Model
- Bedroom name and owner ID
- Environment settings and preferences
- Linked to sleep sessions

### Sleep Data Model
- User, bedroom, and session details
- Sleep thoughts, wake-up counts, cuddle buddy
- Timestamps and session metadata

---

## ✅ Developer Setup Checklist

**For new developers joining the project:**

### Initial Setup
- [ ] Clone repository: `git clone https://github.com/macfarley/dream-weaver-backend.git`
- [ ] Install dependencies: `npm install`
- [ ] Copy `.env.example` to `.env` and configure variables
- [ ] Verify Node.js version (v16+) and MongoDB access
- [ ] Test server starts: `npm run dev`
- [ ] Check health endpoint: http://localhost:3000/health

### Database Setup  
- [ ] Create admin user via `/auth/sign-up` API call
- [ ] Update `ADMIN_USERNAME` in `.env` to match your admin username
- [ ] Run seeding script: `npm run seed`
- [ ] Verify test data created (check MongoDB or use API endpoints)

### Testing Setup
- [ ] Test authentication: Try login with test users (`dreamtester1/password123`)
- [ ] Test protected routes: Create/read bedrooms with valid JWT token
- [ ] Test admin routes: Access admin endpoints with admin user
- [ ] Verify CORS: Test from your frontend application

### Development Workflow
- [ ] Use `npm run dev` for development (auto-restart)
- [ ] Check server logs for detailed error messages
- [ ] Use MongoDB GUI tool for database inspection
- [ ] Follow the API documentation for endpoint testing

**Need Help?** Check the troubleshooting section above or contact the development team.

---

📄 License
MIT License — See LICENSE

🤝 Acknowledgments
Thanks to the General Assembly instructors and the open-source community.

👨‍💻 Author
Macfarley (Mac McCoy)
[LinkedIn](https://www.linkedin.com/in/travis-mccoy-630775b9/)
📝 Contributing
Feel free to open issues or pull requests for improvements.