# 🌉 DreamWeaver Frontend–Backend Bridge

> **Reference for Backend Developers**

---

## Overview

This document summarizes the integration patterns, API endpoints, and best practices for connecting the DreamWeaver frontend (React/Vite) with the backend (Node.js/Express/MongoDB). It is intended as a quick reference for backend contributors and maintainers.

---

## 🔗 Integration Patterns

- **RESTful API**: All communication is via RESTful JSON endpoints.
- **JWT Authentication**: Frontend stores JWT in localStorage and sends it as a Bearer token in the `Authorization` header for all protected routes.
- **Axios**: The frontend uses a centralized Axios instance with interceptors for token injection and error handling.
- **CORS**: Backend must allow CORS for the frontend domain (dev: `localhost:5173`, prod: `dream-weaver-rho.vercel.app`).
- **Error Handling**: Backend returns standardized error objects (`{ error: string, details?: any }`). Frontend displays user-friendly messages.
- **User Roles**: Role-based access enforced on backend (`user`, `admin`). Admin endpoints are protected and require admin JWT.

---

## 📡 Key API Endpoints

| Method | Endpoint                | Description                        | Auth Required | Notes                       |
|--------|-------------------------|------------------------------------|---------------|-----------------------------|
| POST   | `/api/auth/signup`      | Register new user                  | No            | Returns JWT                 |
| POST   | `/api/auth/login`       | User login                         | No            | Returns JWT                 |
| GET    | `/api/users/me`         | Get current user profile           | Yes           | JWT required                |
| PUT    | `/api/users/me`         | Update user profile/preferences    | Yes           | JWT required                |
| GET    | `/api/sleep-sessions`   | List user's sleep sessions         | Yes           |                             |
| POST   | `/api/sleep-sessions`   | Start new sleep session            | Yes           |                             |
| PUT    | `/api/sleep-sessions/:id`| End/update sleep session           | Yes           |                             |
| GET    | `/api/dreams`           | List user's dream journal entries  | Yes           |                             |
| POST   | `/api/dreams`           | Add new dream entry                | Yes           |                             |
| GET    | `/api/bedrooms`         | List user's bedrooms               | Yes           |                             |
| POST   | `/api/bedrooms`         | Add new bedroom                    | Yes           |                             |
| PUT    | `/api/bedrooms/:id`     | Update bedroom                     | Yes           |                             |
| DELETE | `/api/bedrooms/:id`     | Delete bedroom                     | Yes           |                             |
| GET    | `/api/admin/users`      | List all users (admin only)        | Yes (admin)   | Admin JWT required          |
| PUT    | `/api/admin/users/:id`  | Edit user (admin only)             | Yes (admin)   |                             |
| DELETE | `/api/admin/users/:id`  | Delete user (admin only)           | Yes (admin)   | Cascade delete user data    |

> See `BACKEND_API_REFERENCE.md` for full endpoint details.

---

## 🛡️ Best Practices

- **JWT Validation**: All protected endpoints must validate JWT and enforce role-based access.
- **Consistent Error Responses**: Use `{ error: string, details?: any }` for all errors.
- **CORS**: Allow only trusted frontend origins in production.
- **Data Validation**: Validate all incoming data (body, params, query) on the backend.
- **Cascade Deletes**: When deleting users, cascade delete all related data (sleep sessions, dreams, bedrooms).
- **Admin Protections**: Prevent admins from deleting themselves or other admins via the API.
- **Logging**: Log errors and warnings on the backend; avoid verbose logs in production.

---

## 📚 Related Documentation

- [Frontend–Backend Bridge (Frontend Repo)](https://github.com/macfarley/dream-weaver-frontend/blob/main/Public/FRONTEND_BACKEND_BRIDGE.md)
- [Backend API Reference](./BACKEND_API_REFERENCE.md)
- [Frontend GitHub Repository](https://github.com/macfarley/dream-weaver-frontend)
- [Backend GitHub Repository](https://github.com/macfarley/dream-weaver-backend)

---

## 🧑‍💻 Contact & Support

For integration issues, open an issue in the [backend repo](https://github.com/macfarley/dream-weaver-backend) or contact the maintainer via [LinkedIn](https://www.linkedin.com/in/travis-mccoy-630775b9/).

---

*Last updated: June 23, 2025*
