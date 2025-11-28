<p align="center">
  <img src="public/favicon.png" alt="Manage My Truck Logo" width="100"/>
</p>

<h1 align="center">Manage My Truck - Frontend</h1>

<p align="center">
  Modern React-based fleet management dashboard
  <br/>
  <i>Intuitive interface for managing trucks, expenses, and analytics</i>
</p>

---

## 📖 Overview

The Manage My Truck frontend is a responsive, modern web application built with React that provides an intuitive interface for fleet management, expense tracking, and business analytics. It features a clean design with Bootstrap and Ant Design components, offering both desktop and mobile-optimized experiences.

---

## ✨ Features

### 🎨 User Interface Components

#### **Navigation & Layout**
- **NavBar** - Top navigation with user profile and quick actions
- **SideBar** - Persistent sidebar navigation for desktop
- **MenuDrawer** - Mobile-friendly drawer navigation
- **ProfileDrawer** - User profile and settings panel
- **Toast Notifications** - Real-time feedback system with ToastContext

#### **Dashboard Widgets**
- **AlertsWidget** - Real-time notifications and alerts display
- **DriverProfileWidget** - Quick access to driver information
- **MonthlyChart** - Interactive expense and income charts
- **SchedulerWidget** - Maintenance and task scheduling
- **StatisticCard** - KPI metrics and statistics
- **DashboardCard** - Customizable dashboard cards

#### **Modal Dialogs**
- **VehicleModal** - Add/edit truck information
- **CatalogModal** - Browse vehicle catalog
- **ExpenseModal** - Log and manage expenses
- **CalculationsModal** - Financial calculations
- **GetHelpModal** - Support and help center
- **AboutUsModal** - Application information
- **PrivacyPolicyModal** - Privacy policy viewer
- **ConfirmModal** - User action confirmations

#### **Specialized Components**
- **VehicleCard** - Truck information display cards
- **LoaderOverlay** - Loading state overlay
- **LoginLoaderOverlay** - Authentication loading state

### 📱 Pages

#### **Authentication**
- **Login** (`/login`) - Google OAuth and JWT authentication
- **Signup** (`/signup`) - New user registration
- **UnauthorizedAccess** - Access denied page

#### **Main Application**
- **Dashboard** (`/dashboard`) - Main analytics and overview page
- **Trucks** (`/trucks`) - Fleet management and truck listing
- **ExpenseSummary** (`/expenses`) - Comprehensive expense reports
- **CalculateLoan** (`/loan-calculator`) - Financial loan calculator
- **AdminPortal** (`/admin`) - Administrative dashboard (admin-only)

### 🎯 Key Features

#### **Authentication & Security**
- Google OAuth 2.0 integration via `@react-oauth/google`
- JWT token management with `jwt-decode`
- Secure session handling
- Role-based access control (Admin/User)

#### **Data Visualization**
- Interactive charts with Ant Design Charts
- Monthly expense trends
- Income vs expense comparisons
- Real-time dashboard updates

#### **Responsive Design**
- Mobile-first approach
- Bootstrap 5.3 grid system
- Ant Design components
- Context-based mobile detection (`MobileContext`)

#### **User Experience**
- Toast notifications for instant feedback
- Loading states with elegant overlays
- Date pickers for expense entry
- File upload support
- Customizable dashboard layouts

#### **Progressive Web App (PWA)**
- Installable on mobile devices
- Offline capability
- Custom app icons (384x384, 512x512)
- Web manifest configuration

---

## 🛠️ Tech Stack

| Category | Technology | Version |
|----------|-----------|---------|
| **Core Framework** | React | 18.3.1 |
| **UI Framework** | Bootstrap | 5.3.3 |
| **Component Library** | Ant Design (antd) | 5.20.1 |
| **Charts** | Ant Design Charts | 2.6.6 |
| **Routing** | React Router DOM | 6.26.1 |
| **HTTP Client** | Axios | 1.7.4 |
| **Authentication** | @react-oauth/google | 0.12.1 |
| **Date Handling** | Moment.js | 2.30.1 |
| | date-fns | 3.6.0 |
| | react-datepicker | 7.3.0 |
| **Icons** | Primer Octicons React | 19.11.0 |
| **Loaders** | @uiball/loaders | 1.3.1 |
| **WebAuthn** | @simplewebauthn/browser | 13.2.2 |
| **Testing** | React Testing Library | 13.4.0 |
| | Jest DOM | 5.17.0 |

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- Backend API running (see `backend/README.md`)

### Installation

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env with your configuration
nano .env
```

### Environment Variables

Create a `.env` file in the frontend directory:

```env
# Backend API URL
REACT_APP_BACKEND_URL=http://localhost:8000

# Google OAuth Client ID
REACT_APP_GOOGLE_CLIENT_ID=your_google_client_id_here

# Optional: API endpoints (if different from default)
REACT_APP_API_VERSION=v1
```

### Development

```bash
# Start development server
npm start

# The app will open at http://localhost:3000
```

### Build for Production

```bash
# Create optimized production build
npm run build

# The build folder will contain the production-ready files
```

### Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm test -- --coverage
```

---

## 📁 Project Structure

```
frontend/
├── public/
│   ├── index.html              # Main HTML file
│   ├── manifest.json           # PWA manifest
│   ├── favicon.png             # App favicon
│   ├── mmt_icon.png            # App icon (192x192)
│   ├── mmt_icon_x384.png       # App icon (384x384)
│   ├── mmt_icon_x512.png       # App icon (512x512)
│   ├── driver.png              # Driver placeholder image
│   ├── truck.jpg               # Truck image
│   ├── contact.avif            # Contact image
│   └── robots.txt              # SEO robots file
│
├── src/
│   ├── Components/
│   │   ├── AboutUsModal/       # About application modal
│   │   ├── CalculationsModal/  # Financial calculations modal
│   │   ├── CatalogModal/       # Vehicle catalog browser
│   │   ├── ConfirmModal/       # Confirmation dialog
│   │   ├── Dashboard/
│   │   │   ├── AlertsWidget/   # Dashboard alerts
│   │   │   ├── DriverProfileWidget/  # Driver info widget
│   │   │   ├── MonthlyChart/   # Charts and graphs
│   │   │   └── SchedulerWidget/  # Task scheduler
│   │   ├── DashboardCard/      # Reusable dashboard card
│   │   ├── ExpenseModal/       # Expense entry modal
│   │   ├── GetHelpModal/       # Help and support
│   │   ├── LoaderOverlay/      # Loading overlay
│   │   ├── LoginLoaderOverlay/ # Auth loading state
│   │   ├── MenuDrawer/         # Mobile menu drawer
│   │   ├── MobileContext/      # Mobile detection context
│   │   ├── NavBar/             # Top navigation bar
│   │   ├── PrivacyPolicyModal/ # Privacy policy viewer
│   │   ├── ProfileDrawer/      # User profile drawer
│   │   ├── SideBar/            # Desktop sidebar
│   │   ├── StatisticCard/      # Statistics display card
│   │   ├── ToastContext/       # Toast notification system
│   │   ├── VehicleCard/        # Truck display card
│   │   └── VehicleModal/       # Add/edit vehicle modal
│   │
│   ├── Pages/
│   │   ├── AdminPortal/        # Admin dashboard page
│   │   ├── Auth/
│   │   │   ├── Login/          # Login page
│   │   │   └── Signup/         # Signup page
│   │   ├── CalculateLoan/      # Loan calculator page
│   │   ├── Dashboard/          # Main dashboard page
│   │   ├── ExpenseSummary/     # Expense reports page
│   │   ├── Trucks/             # Fleet management page
│   │   └── UnauthorizedAccess/ # 403 error page
│   │
│   ├── Routes/
│   │   ├── Routes.js           # Route definitions
│   │   └── Home.js             # Home/landing page
│   │
│   ├── Config/
│   │   └── Axios/
│   │       └── Axios.js        # Axios configuration
│   │
│   ├── Utils/
│   │   └── dashboardLayoutUtils.js  # Dashboard utilities
│   │
│   ├── Styles/
│   │   └── Dashboard.css       # Dashboard styles
│   │
│   ├── App.js                  # Root component
│   ├── App.css                 # Global app styles
│   ├── index.js                # Application entry point
│   ├── index.css               # Global CSS
│   └── logo.svg                # React logo
│
├── package.json                # Dependencies and scripts
└── README.md                   # This file
```

---

## 🔌 API Integration

The frontend communicates with the backend API via Axios. Configuration is centralized in `src/Config/Axios/Axios.js`.

### API Endpoints Used

```javascript
// Authentication
POST /api/v1/app/auth/login
POST /api/v1/app/auth/signup
POST /api/v1/app/auth/google

// User Management
GET /api/v1/app/users/profile
PUT /api/v1/app/users/profile

// Trucks
GET /api/v1/app/truck
POST /api/v1/app/truck
PUT /api/v1/app/truck/:id
DELETE /api/v1/app/truck/:id

// Expenses
GET /api/v1/app/fuelExpenses
POST /api/v1/app/fuelExpenses
GET /api/v1/app/defExpenses
POST /api/v1/app/defExpenses
GET /api/v1/app/otherExpenses
POST /api/v1/app/otherExpenses
GET /api/v1/app/totalExpenses

// Income
GET /api/v1/app/income
POST /api/v1/app/income

// Driver Profiles
GET /api/v1/app/driverProfiles
POST /api/v1/app/driverProfiles

// Alerts
GET /api/v1/app/alerts
POST /api/v1/app/alerts

// Loan Calculator
POST /api/v1/app/calculateLoan

// Admin
GET /api/v1/app/admin/users
GET /api/v1/app/admin/stats
```

---

## 🎨 Styling

The application uses a combination of:
- **Bootstrap 5.3** for layout and basic components
- **Ant Design** for advanced UI components
- **Custom CSS** for specific styling needs

### Theme Customization

The application supports custom theming through CSS variables and Ant Design's theme configuration.

---

## 📱 Progressive Web App

The application is configured as a PWA with:
- Service worker for offline functionality
- App manifest for installability
- Multiple icon sizes for various devices
- Splash screens for mobile devices

### Installing the App

Users can install the application on their devices:
- **Desktop**: Click the install button in the browser address bar
- **Mobile**: Use "Add to Home Screen" from the browser menu

---

## 🔐 Authentication Flow

```
1. User clicks "Login with Google"
2. Google OAuth popup opens
3. User authenticates with Google
4. Frontend receives JWT token
5. Token stored in localStorage
6. Axios interceptor adds token to all requests
7. Protected routes check token validity
8. Redirect to dashboard on success
```

---

## 🚀 Deployment

### Vercel Deployment (Recommended)

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod
```

### Manual Deployment

```bash
# Build the application
npm run build

# Deploy the 'build' folder to your hosting service
```

---

## 🧪 Testing

The application includes test setup for:
- Component testing with React Testing Library
- Integration testing
- User interaction testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Generate coverage report
npm test -- --coverage
```

---

## 📊 Performance Optimization

- **Code Splitting**: React.lazy and Suspense for route-based splitting
- **Image Optimization**: Optimized images in WebP/AVIF formats
- **Bundle Size**: Analyzed and optimized bundle sizes
- **Caching**: Service worker caching for offline support

---

## 🔧 Available Scripts

```bash
# Start development server
npm start

# Build for production
npm run build

# Run tests
npm test

# Eject from Create React App (irreversible)
npm run eject
```

---

## 🐛 Troubleshooting

### Common Issues

**Issue**: Application not connecting to backend
- **Solution**: Check `REACT_APP_BACKEND_URL` in `.env` file

**Issue**: Google OAuth not working
- **Solution**: Verify `REACT_APP_GOOGLE_CLIENT_ID` is correct

**Issue**: Charts not rendering
- **Solution**: Ensure Ant Design Charts is properly installed

**Issue**: Build fails
- **Solution**: Clear node_modules and reinstall: `rm -rf node_modules && npm install`

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](../LICENSE) file for details.

---

## 👥 Contributors

Made with ❤️ by Team AWengerS

---

## 📚 Additional Resources

- [React Documentation](https://reactjs.org/)
- [Ant Design Documentation](https://ant.design/)
- [Bootstrap Documentation](https://getbootstrap.com/)
- [React Router Documentation](https://reactrouter.com/)

---

<p align="center">
  <a href="../README.md">← Back to Main README</a>
</p>
