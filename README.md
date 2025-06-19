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
backend/
├── controllers/
│   ├── admin.js
│   ├── auth.js
│   ├── bedrooms.js
│   ├── goToBed.js
│   ├── sleepData.js
│   └── users.js
├── middleware/
│   ├── requireAdmin.js
│   └── verifyToken.js
├── models/
│   ├── Bedroom.js
│   ├── SleepData.js
│   └── User.js
├── scripts/
│   └── seed.js
├── .env
├── server.js
└── package.json
```

---

## 📦 Installation

1. Clone the backend repo:

   ```bash
   git clone https://github.com/macfarley/dream-weaver-backend.git
   cd dream-weaver-backend
Install dependencies:

bash
Copy
Edit
npm install
3. Create a `.env` file with the following variables:

   ```ini
   PORT=3000
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret_key
   ```
4. Seed the database (optional):

   ```bash
   node scripts/seed.js
   ```

5. Run the server locally:

   ```bash
   npm start
   ```

---

## 🧑‍💻 API Endpoints Overview

### 🔓 **Authentication Routes**
| Route | Method | Description | Auth Required |
|-------|---------|-------------|---------------|
| `/auth/sign-up` | POST | Create new user account | No |
| `/auth/sign-in` | POST | Login user and get JWT token | No |

### 👤 **User Routes**
| Route | Method | Description | Auth Required |
|-------|---------|-------------|---------------|
| `/users/profile` | PUT | Update current user profile | Yes |
| `/users/admin/all` | GET | List all users (admin only) | Admin only |
| `/users/admin/:userId/role` | PUT | Change user role (admin only) | Admin only |
| `/users/admin/:userId` | DELETE | Delete user (admin only) | Admin only |

### 🛏️ **Bedroom Routes**
| Route | Method | Description | Auth Required |
|-------|---------|-------------|---------------|
| `/bedrooms` | GET | List user bedrooms | Yes |
| `/bedrooms` | POST | Create new bedroom | Yes |
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
| `/gotobed/wakeup` | POST | Add wakeup data to session | Yes |

### 🛠️ **Admin Routes**
| Route | Method | Description | Auth Required |
|-------|---------|-------------|---------------|
| `/admin/users` | GET | List all users | Admin only |
| `/admin/users/:id` | GET | Get specific user details | Admin only |
| `/admin/users/:id` | PUT | Update user (except role/username) | Admin only |
| `/admin/users/:id` | DELETE | Delete user (requires admin password) | Admin only |

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

📄 License
MIT License — See LICENSE

🤝 Acknowledgments
Thanks to the General Assembly instructors and the open-source community.

👨‍💻 Author
Macfarley (Mac McCoy)
[LinkedIn](https://www.linkedin.com/in/travis-mccoy-630775b9/)
📝 Contributing
Feel free to open issues or pull requests for improvements.