# EthioAI Tourism Platform - Frontend

AI-powered tourism platform for Ethiopia built with React, TypeScript, and modern web technologies.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm

### Installation & Run

```bash
cd frontend
npm install
npm run dev
```

The app will be available at **http://localhost:3000**

## 🎯 Current Status

### ✅ Completed
- Project structure and configuration
- Tailwind CSS with custom theme
- Path aliases (@components, @features, etc.)
- Authentication UI (Login, Register, Forgot Password)
- Form validation with Zod
- Common UI components (Button, Input, Card, Loader)
- Responsive design
- Accessibility features
- i18n support (en, am, om)

### ⏳ Pending
- Redux store integration
- API service layer
- Protected routes
- Session management
- Backend integration

## 📱 Available Pages

- **`/login`** - Login page with email/password
- **`/register`** - Registration page with validation
- **`/forgot-password`** - Password reset request
- **`/dashboard`** - Placeholder dashboard (after login)

## 🧪 Testing the UI

You can test the authentication forms without a backend:

1. Navigate to `/login` or `/register`
2. Fill in the forms (validation works!)
3. Submit to see console logs
4. Check form validation by entering invalid data

**Demo credentials** (for reference):
- Email: `demo@example.com`
- Password: `Demo123!`

## 📁 Project Structure

```
frontend/
├── src/
│   ├── api/                    # API configuration (pending)
│   ├── components/common/      # Reusable UI components ✅
│   ├── features/auth/          # Authentication feature ✅
│   │   ├── components/         # Login, Register forms
│   │   ├── pages/              # Auth pages
│   │   ├── schemas/            # Zod validation schemas
│   │   └── types/              # TypeScript types
│   ├── hooks/                  # Custom React hooks
│   ├── store/                  # Redux store (pending)
│   ├── services/               # API services (pending)
│   ├── utils/                  # Utility functions ✅
│   └── styles/                 # Global styles ✅
```

## 🛠️ Tech Stack

- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **React Router** - Navigation
- **React Hook Form** - Form handling
- **Zod** - Schema validation
- **Framer Motion** - Animations
- **i18next** - Internationalization

## 🌍 Supported Languages

- English (en) - Default
- Amharic (አማርኛ)
- Oromo (Afaan Oromoo)

## 📝 Next Steps

1. **Redux Integration** - Connect forms to state management
2. **API Services** - Implement authentication API calls
3. **Protected Routes** - Add route guards
4. **Session Management** - Handle JWT tokens
5. **Backend Integration** - Connect to API

## 🎨 Design System

All components use a consistent design system with:
- CSS variables for theming
- Dark mode support
- Accessible color contrast
- Responsive breakpoints
- Consistent spacing

## 📚 Documentation

- **SETUP.md** - Configuration details
- **AUTH_COMPONENTS.md** - Authentication components documentation
- **.kiro/specs/** - Feature specifications and requirements
