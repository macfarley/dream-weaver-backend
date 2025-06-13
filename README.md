# 🌙 DreamWeaver Backend 😴

![DreamWeaver Logo](./public/logo.png)

> *Sleep data storage and API for DreamWeaver frontend.*

---

![Screenshot of API in action](./public/screenshot.png)

---

## ✨ About the Project

This is the **backend** repository for DreamWeaver, providing a RESTful API built with **Node.js**, **Express**, and **MongoDB**. It handles user authentication, bedroom environment data, sleep session tracking, dream journaling, and administrative management.

---

## 🚀 Features

- 🔐 Secure JWT-based authentication and role-based authorization
- 🛏️ CRUD endpoints for Bedrooms linked to users
- 🌛 Sleep session lifecycle: GoToBed start, wakeUp updates, and journaling
- 👤 User profile management with preferences and roles
- 🛠️ Admin dashboard endpoints for user and data management
- 📅 Date/time handling with timezone and formatting preferences
- 🔄 Token verification middleware and error handling

---

## 🛠️ Tech Stack

- 🟢 Node.js (Express)
- 🍃 MongoDB (Mongoose ODM)
- 🔐 JWT tokens for auth
- 🧪 Jest/Mocha (planned for testing)
- 🔧 Dotenv for environment variables

---

## 📂 Project Structure

backend/
├── controllers/
│ ├── adminController.js
│ ├── authController.js
│ ├── bedroomsController.js
│ ├── goToBedController.js
│ └── usersController.js
├── middleware/
│ ├── admin.js
│ └── verifyToken.js
├── models/
│ ├── Bedroom.js
│ ├── SleepData.js
│ ├── User.js
│ └── UserPreferences.js
├── routes/
│ ├── admin.js
│ ├── auth.js
│ ├── bedrooms.js
│ ├── gotobed.js
│ └── users.js
├── seed/
│ └── seed.js
├── utils/
│ └── helpers.js
├── .env
├── server.js
└── package.json

yaml
Copy
Edit

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
Create a .env file with the following variables:

ini
Copy
Edit
PORT=3000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
Seed the database (optional):

bash
Copy
Edit
node seed/seed.js
Run the server locally:

bash
Copy
Edit
npm start
🧑‍💻 API Endpoints Overview
Route	Method	Description	Auth Required
/auth/signup	POST	Create new user	No
/auth/login	POST	Login user and get JWT	No
/users/profile	GET	Get current user profile	Yes
/users/profile	PUT	Update current user profile	Yes
/bedrooms	GET	List user bedrooms	Yes
/bedrooms	POST	Create new bedroom	Yes
/bedrooms/:id	GET	Get bedroom by ID	Yes
/bedrooms/:id	PUT	Update bedroom	Yes
/bedrooms/:id	DELETE	Delete bedroom	Yes
/gotobed	POST	Start new sleep session	Yes
/gotobed/wakeup	POST	Add wakeup data to current session	Yes
/users/sleepdata/:date	GET	Get SleepData by date	Yes
/users/sleepdata/:date	PUT	Update SleepData by date	Yes
/users/sleepdata/:date	DELETE	Delete SleepData by date	Yes
/admin/users	GET	List all users (admin only)	Admin only
/admin/users/:id	PUT	Update any user (admin only)	Admin only
/admin/users/:id	DELETE	Delete any user (admin only)	Admin only

📖 Usage Notes
JWT tokens expire after a set time to enhance security.

Users can only modify their own data unless admin.

Sleep sessions track multiple wake-up events with quality ratings and journaling.

User preferences for units, theme, and formatting are synced and respected in data responses.

Admin routes allow managing all users and overseeing system health.

📄 License
MIT License — See LICENSE

🤝 Acknowledgments
Thanks to the General Assembly instructors and the open-source community.

👨‍💻 Author
Macfarley (Mac McCoy)
[LinkedIn](https://www.linkedin.com/in/travis-mccoy-630775b9/)
📝 Contributing
Feel free to open issues or pull requests for improvements.