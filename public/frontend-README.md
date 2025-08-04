# 🌙 DreamWeaver Frontend 😴

![DreamWeaver Logo](./Public/DW-Logo.png)

> *Mindful sleep, made digital.*

---

![Screenshot of DreamWeaver App](./src/assets/DW-Live-Screenshot-2025-06-23.png)

---

## 🏆 Development Methodology

Visual assets included in this project were generated using AI technology provided by ImagePrompt.org.

Favicons were produced by converting images with the assistance of RedKetchup's Favicon Generator.

**AI-Assisted Development**: This project demonstrates effective collaboration with AI tools for enhanced development efficiency. GitHub Copilot was leveraged for comprehensive code review, debugging assistance, documentation generation, and quality assurance. This approach showcases modern development practices where AI augments developer capabilities for improved code quality, faster problem resolution, and maintainable software architecture.

This project is a student portfolio piece intended for educational and demonstrative purposes.

--- ✨ About the Project

DreamWeaver is a mindfulness and self-accountability app that helps users improve their sleep through intentional bedtime rituals and reflective journaling. With just a single tap, users can log their journey to sleep, capture dreams or sleepy thoughts, and track patterns over time.

This is the **frontend** repository, built using **React**, **Vite**, and **Bootstrap**.

---

## 🚀 Features

- 🔐 **Authentication System** - JWT-based signup, login, and secure logout
- 📱 **Mobile-First Design** - Responsive Bootstrap UI that works on all devices
- 🌒 **Interactive Dashboard** featuring:
  - User profile summary with customizable preferences
  - Bedroom environment management and tracking
  - Recent sleep sessions and dream journal entries
  - Quick access to all major app functions
- 🌛 **Sleep Tracking** - One-click "Go To Bed" and "Wake Up" with session logging
- 🎯 **BigActionButton** - Prominent Shazam-style circular button with:
  - Context-aware functionality (Go to Bed vs Wake Up based on current sleep state)
  - DreamWeaver logo integration with pulse animations
  - Consistent placement across landing page, about page, and error pages
  - Theme-aware styling and responsive design
- 📓 **Dream Journaling** - Capture thoughts, dreams, and reflections organized by sleep session
- 🛏️ **Smart Bedroom Management** - Track environmental factors (light, noise, temperature) across multiple sleeping spaces
- 📊 **Sleep Analytics** - View sleep history, patterns, and quality assessments over time
- ⚙️ **User Preferences** - Comprehensive preference system with site-wide consistency:
  - **Theme**: Dark/light mode with instant switching and persistence
  - **Units**: Imperial (°F, miles) vs Metric (°C, kilometers) for all measurements
  - **Date Format**: MM/DD/YYYY, DD/MM/YYYY, or YYYY-MM-DD across all components
  - **Time Format**: 12-hour (AM/PM) or 24-hour display for all time fields
  - **Sleep Reminders**: Configurable browser-based reminder system
  - Real-time preference sync across all app components and views
- 🧭 **Intuitive Navigation** - Semantic routing with breadcrumbs, back navigation, and user-friendly URLs
- 📱 **Enhanced Mobile UX** - Right-aligned slide-out navigation panel (50-60% screen width) with improved accessibility
- 🎨 **BigActionButton Component** - Reusable prominent action button with automatic sleep state detection and consistent theming
- 🛡️ **Admin Dashboard** - Comprehensive administrative interface featuring:
  - Role-based user management (admins listed first, then users alphabetically)
  - Individual user profile editing and management (admin profile now matches user profile visually and is non-editable by default)
  - Secure user deletion with admin password confirmation and cascade data removal
  - Mobile-friendly dual-mode user profile editing (self-edit vs admin-edit)
  - Permission-based restrictions (cannot edit other admins, delete admin accounts, or delete self)
  - Protected admin routes with proper authentication and authorization
  - Professional logging and error handling throughout admin features
- ♿ **Accessibility Features** - Screen reader support, ARIA labels, and keyboard navigation
- 📝 **Production-Ready Logging** - Only errors and warnings are logged in production; all debug logs are removed or commented out
- 🧹 **Dev/Test File Isolation** - All development, test, and scratch files are organized in `_dev_local/` and excluded from production builds
- 🏁 **Verified Build Readiness** - All features and tweaks are build-verified and ready for deployment

---

## 🖼️ Screenshots

![Live DreamWeaver Screenshot](./src/assets/DW-Live-Screenshot-2025-06-23.png)

[🌐 View the Live Site](https://dream-weaver-rho.vercel.app/)

---

## 🛠️ Tech Stack

- ⚛️ **React 18** (Hooks, Context API, Suspense, Lazy Loading)
- ⚡ **Vite** (blazing-fast dev server, HMR, optimized builds)
- 🎨 **Bootstrap 5** (responsive grid, utility classes, custom Sass, theming)
- 💅 **Sass/SCSS** (custom variables, modular component styles)
- 🧠 **React Context API** (User, Dashboard, Theme, global state management)
- 🔄 **Axios** (RESTful API integration, interceptors, error handling, JWT auth)
- 🗺️ **React Router v6** (nested routes, protected routes, semantic navigation)
- 📅 **date-fns** (date parsing, formatting, manipulation)
- 🎯 **Lucide React** (SVG icon system, consistent iconography)
- 🍞 **React Toastify** (user notifications, toasts)
- 🌍 **Theme System** (dark/light mode, user preference sync, CSS variables)
- 🧪 **ESLint** (linting, code quality, Airbnb/React rules)
- 🧰 **VS Code** (settings, tasks, devcontainer support)
- 🧩 **Modular Architecture** (domain-based folders, barrel exports, lazy loading)
- 🧬 **JSDoc** (inline documentation, type hints)
- 🧹 **Prettier** (code formatting, style consistency)
- 🧪 **Jest** (unit testing, test-driven development)
- 🧑‍💻 **Git & GitHub** (version control, CI/CD, project management)
- 🏗️ **Vercel/Netlify** (cloud deployment, static hosting)
- 🛡️ **JWT Authentication** (secure login, protected routes)
- 🔒 **Security Best Practices** (input sanitization, role-based access, CORS)
- 📦 **npm** (package management, scripts)
- 🧭 **Modern JavaScript (ES2022+)** (arrow functions, async/await, destructuring)
- 🧑‍🔬 **OpenAI/GitHub Copilot** (AI-assisted development, code review)
- 🧩 **Third-Party Integrations** (RedKetchup Favicon Generator, ImagePrompt.org)
- 🧑‍🎨 **Figma/Draw.io** (wireframes, UI/UX design assets)
- 📱 **Mobile-First Design** (responsive, touch-friendly, accessibility)
- ♿ **Accessibility** (ARIA labels, keyboard navigation, screen reader support)
- 🏁 **Production-Ready Build** (npm run build, optimized assets, code splitting)

---

## 📂 Project Structure

```
src/
├── components/           # Organized by domain and functionality
│   ├── ui/              # Reusable interface elements
│   │   ├── uiComponents.js     # Barrel export for UI components
│   │   ├── BigActionButton.jsx # Main action button with smart states
│   │   ├── DashboardBox.jsx    # Reusable dashboard card component
│   │   ├── Loading.jsx         # Loading spinner component
│   │   ├── ThemeToggle.jsx     # Dark/light mode toggle
│   │   └── ...                 # Sliders, form controls, etc.
│   ├── auth/            # Authentication components
│   │   ├── authComponents.js   # Barrel export for auth components
│   │   ├── LoginForm.jsx       # User login form
│   │   ├── SignupForm.jsx      # User registration form
│   │   └── UserProfile.jsx     # User profile management
│   ├── sleep/           # Sleep-related components
│   │   ├── sleepComponents.js  # Barrel export for sleep components
│   │   ├── BedroomForm.jsx     # Bedroom environment setup
│   │   ├── GoToBedForm.jsx     # Pre-sleep logging form
│   │   ├── WakeUpForm.jsx      # Wake-up logging form
│   │   └── SleepDebugger.jsx   # Sleep state debugging
│   ├── system/          # System utility components
│   │   ├── systemComponents.js # Barrel export for system components
│   │   ├── PreferenceSync.jsx  # Preference synchronization
│   │   └── UserRedirect.jsx    # Smart user routing
│   ├── layout/          # Layout components
│   │   ├── NavBar.jsx          # Navigation with auth state
│   │   └── Footer.jsx          # Application footer
│   └── admin/           # Admin-only components (lazy loaded)
│       ├── AdminDashboard.jsx      # Admin control panel
│       ├── AdminUserProfile.jsx    # Admin user management
│       └── AdminOnlyRoute.jsx      # Admin route protection
├── pages/               # Page-level components
│   ├── dashboard/       # Dashboard pages
│   │   ├── Dashboard.jsx       # Main dashboard page
│   │   ├── BedroomIndex.jsx    # Bedroom listing page
│   │   ├── BedroomDetails.jsx  # Individual bedroom details
│   │   ├── SleepDataIndex.jsx  # Sleep history listing
│   │   ├── SleepSession.jsx    # Individual session details
│   │   └── DreamIndex.jsx      # Dream journal listing
│   ├── LandingPage.jsx  # Home/landing page
│   ├── About.jsx        # About page
│   ├── JoinUs.jsx       # Auth page (login/signup)
│   └── Unauthorized.jsx # 403 error page
├── contexts/            # React Context providers
│   ├── UserContext.jsx      # User authentication state
│   ├── DashboardContext.jsx # Dashboard data management
│   └── ThemeContext.jsx     # Theme preferences
├── hooks/               # Custom React hooks
│   └── usePreferenceSync.js # Preference synchronization hook
├── services/            # **Fully standardized** API modules with axios
│   ├── apiConfig.js         # Centralized axios with auth injection
│   ├── authService.js       # Authentication & token management
│   ├── userService.js       # User profile & preferences
│   ├── adminService.js      # Admin user management
│   ├── sleepSessionService.js # Sleep session tracking
│   ├── sleepDataService.js   # Sleep history & analytics
│   └── bedroomService.js     # Bedroom environment management
├── utils/               # Utility functions organized by domain
│   ├── format/          # Data formatting utilities
│   │   ├── formatUtils.js      # Barrel export for format utils
│   │   ├── userPreferences.js  # Preference-aware formatting
│   │   └── urlSafeNames.js     # URL sanitization
│   └── sleep/           # Sleep-specific utilities
│       ├── sleepUtils.js       # Barrel export for sleep utils
│       ├── sleepStateUtils.js  # Sleep state management
│       ├── sleepStreaks.js     # Streak calculations
│       └── sleepDataUtils.js   # Sleep data processing
├── styles/              # Sass stylesheets
│   ├── custom.scss          # Main stylesheet
│   ├── _variables.scss      # Sass variables
│   └── componentStyles/     # Component-specific styles
├── assets/              # Static assets (images, logos, wireframes)
├── App.jsx              # Main app with routing & lazy loading
└── main.jsx             # Application entry point
```

### 🎯 Key Organizational Principles:

- **Domain-based grouping** - Components organized by functionality (ui, auth, sleep)
- **Descriptive naming** - No generic `index.js` files, all names describe contents
- **Barrel exports** - Clean imports via `*Components.js` files
- **Page separation** - Page-level components in dedicated `pages/` directory
- **Utility organization** - Utils grouped by domain (format, sleep)
- **Lazy loading** - Admin components loaded only when needed
- **Consistent patterns** - All services use named exports, consistent import style

---

## 🚀 Getting Started

1. **Clone the frontend repo:**

   ```bash
   git clone https://github.com/macfarley/dream-weaver-frontend.git
   cd dream-weaver-frontend
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Add your `.env` file:**

   ```
   VITE_BACK_END_SERVER_URL=http://localhost:3000
   ```

4. **Run the app locally:**

   ```bash
   npm run dev
   ```

---

## 👩‍💻 Developer Notes

- **Authentication**: All protected routes require JWT token validation through the backend API
- **Admin System**: Role-based access control with protected admin routes, user management interface, and secure deletion with cascade data removal
- **BigActionButton**: Prominent sleep action component with automatic state detection, consistent across multiple pages (landing, about, unauthorized)
- **Mobile Navigation**: Enhanced UX with right-aligned slide-out panel, click-outside-to-close, and improved accessibility
- **API Architecture**: **Fully standardized axios configuration** with:
  - Centralized API instance with automatic Bearer token injection via interceptors
  - Consistent error handling patterns across all service modules
  - Complete removal of fetch() and manual token handling
  - Standardized service method signatures (no token parameters needed)
  - Unified response handling and error propagation
- **State Management**: User preferences (units, theme, time format) sync between frontend contexts and backend storage
- **Error Handling**: Comprehensive error boundaries and user-friendly error messages throughout the application  
- **Accessibility**: Built with ARIA labels, screen reader support, and keyboard navigation standards
- **API Integration**: RESTful API communication with robust error handling and input validation, including dedicated admin endpoints
- **Code Quality**: Extensive JSDoc documentation, consistent code patterns, and comprehensive commenting
- **Security**: Input sanitization, token-based authentication, role-based access controls, and admin password confirmation for destructive operations
- **Performance**: Optimized builds, lazy loading, and efficient state management
- **Responsive Design**: Mobile-first approach with Bootstrap grid system and custom breakpoints
- **SCSS Import Structure:** All styles are loaded via `custom.scss` only. No direct SCSS imports in React components. This ensures global style consistency and prevents duplicate/inconsistent styles.
- **Logging:** All excessive/verbose console logs have been removed or commented out. Only errors and warnings are logged in production. No sensitive or verbose data is output in production builds. Logging best practices are followed throughout the codebase.
- **Admin/User Profile:** Admin profile view is non-editable by default and visually matches the regular user profile. All user data extraction and field population is robust and consistent.
- **Build Readiness:** All major code, UX, and logging improvements are complete and verified. The codebase is ready for production build.

---

## 🌐 Deployment Notes

To deploy the frontend (e.g., Netlify, Vercel):

- Update `VITE_BACK_END_SERVER_URL` to match your production API endpoint.
- Ensure HTTPS and CORS headers are handled on the backend.
- Optionally build using:

  ```bash
  npm run build
  ```

---

## 🔗 Links

- 🧠 [Backend GitHub Repository](https://github.com/macfarley/dream-weaver-backend)
- 💻 [Frontend GitHub Repository](https://github.com/macfarley/dream-weaver-frontend)
- 📖 [Live Site – https://dream-weaver-rho.vercel.app/](https://dream-weaver-rho.vercel.app/)

---

## 📄 License & Legal Notices

This project is licensed under the MIT License. See the LICENSE file for details.

**Medical Disclaimer:**
DreamWeaver is not a medical device or a substitute for professional medical advice, diagnosis, or treatment. All features and content are for informational and self-reflective purposes only. Users should consult a qualified healthcare provider for any questions regarding sleep, mental health, or medical conditions.

**User Content & Privacy:**
DreamWeaver is a private, non-social journaling and self-accountability tool. Any notes, dreams, or journal entries users create are for their own private use and are not shared publicly or with other users. We do not monitor, endorse, or take responsibility for the content of private notes or journals. However, we reserve the right to remove or delete any user profile or data if we become aware of content that is illegal, promotes hate, violence, or discrimination, or otherwise violates our inclusive and respectful community standards. This includes, but is not limited to, content that explores or glorifies Nazi ideology, serial killer fantasies, or other forms of hate speech or criminal activity. DreamWeaver is not a social media platform and does not support or condone the use of the app for such purposes.

**Inclusivity Statement:**
DreamWeaver is committed to providing a safe, inclusive, and respectful environment for all users, regardless of background, identity, or beliefs. We do not tolerate hate speech, discrimination, or the use of the platform for harmful or illegal activities.

---

## 🤝 Acknowledgments

Created as a final project for the General Assembly Software Engineering Bootcamp. Thanks to our instructors, peers, and the open-source community for inspiration and guidance.

---

## 🧙‍♂️ Author

Built by Macfarley (Travis McCoy)  
[LinkedIn](https://www.linkedin.com/in/travis-mccoy-630775b9/)  
[Download Resume (PDF)](./Resume-Travis-McCoy.pdf)

---

### Professional Summary

Full-stack software engineer with a passion for building accessible, user-focused web applications. Experienced in modern JavaScript (ES2022+), React, Vite, Node.js, Express, MongoDB, RESTful APIs, and cloud deployment. Adept at rapid prototyping, UI/UX design, and collaborating with cross-functional teams. Committed to inclusive, ethical, and maintainable software development.

- **Core Skills:** React, Vite, Node.js, Express, MongoDB, REST APIs, Bootstrap, Sass, Git, GitHub, CI/CD, JWT Auth, Accessibility, Testing (Jest), Agile, Figma, Draw.io, VS Code, Linux, Cloud Deployment (Vercel/Netlify)
- **Soft Skills:** Communication, teamwork, problem-solving, adaptability, attention to detail, empathy, and a growth mindset
- **Certifications:** General Assembly Software Engineering Immersive (2025)
- **Portfolio:** [dream-weaver-rho.vercel.app](https://dream-weaver-rho.vercel.app/)

For a full work history, education, and project list, see the attached resume.

---

## ❓ Support

Run into issues? Head to [GitHub repo](https://github.com/macfarley/dream-weaver) and open an issue.
For feature requests, please create a new issue and label it as a feature request.
For bugs, please create a new issue and label it as a bug.
For general inquiries, please reach out via [LinkedIn](https://www.linkedin.com/in/travis-mccoy-630775b9/).
