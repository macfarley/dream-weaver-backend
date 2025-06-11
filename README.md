# 🌙 dreamWeaver

**dreamWeaver** is a minimalist sleep-tracking web app that helps users monitor their sleep quality, log pre- and post-sleep notes, and customize their sleep environments through configurable "bedrooms."

Users can access it via the web or save it to their mobile home screen like an app.

---

## 🚀 Features

- Start and stop sleep sessions with a simple "Go to Bed" / "Wake Up" workflow  
- Create and manage multiple "bedrooms" to track sleeping conditions (temperature, noise, light, etc.)  
- Record sleepy thoughts and morning reflections with each session  
- Rate how well-rested you feel upon waking  
- View sleep graphs and dream journal history in a user-friendly dashboard  

---

## 🛠 Tech Stack

- **Frontend:** React  
- **Backend:** Node.js + Express  
- **Database:** MongoDB (Mongoose)  
- **Authentication:** JWT-based session management  

---

## 🌐 API Endpoints

### 🔐 Authentication  
| Method | Endpoint           | Description                   |  
|--------|--------------------|-------------------------------|  
| POST   | `/auth/signup`     | Register a new user            |  
| POST   | `/auth/login`      | Log in an existing user        |  

---

### 👤 User Management  
| Method | Endpoint          | Description                                   |  
|--------|-------------------|-----------------------------------------------|  
| GET    | `/users`          | Get all users (admin only)                   |
| GET    | `/users/:id`      | Get user info (admin or self)                |  
| PUT    | `/users/:id`      | Update user info (admin or self)             |  

---

### 🛏️ Bedroom Management  
| Method | Endpoint          | Description                                   |  
|--------|-------------------|-----------------------------------------------|  
| GET    | `/bedrooms`       | Retrieve all bedrooms for authenticated user  |  
| POST   | `/bedrooms`       | Create a new bedroom                           |  
| PUT    | `/bedrooms/:id`   | Update a bedroom                               |  
| DELETE | `/bedrooms/:id`   | Delete a bedroom                               |  

### 😴 Sleep Session Management (`/gotobed`)
| Method | Endpoint                             | Description                                         |
|--------|--------------------------------------|-----------------------------------------------------|
| GET    | `/gotobed`                           | Retrieve all sleep sessions for user                |
| GET    | `/gotobed/:id`                       | Retrieve a specific sleep session                   |
| POST   | `/gotobed`                           | Start a new sleep session                           |
| PUT    | `/gotobed/wakeup`                    | Add a wake-up entry (multiple allowed)              |
| PATCH  | `/gotobed/wakeup/:index/backtobed`   | Add back-to-bed timestamp to a specific wake entry  |
| PUT    | `/gotobed/:id`                       | Update sleep session manually                       |
| DELETE | `/gotobed/:id`                       | Delete a sleep session         