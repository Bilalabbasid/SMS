# 🎓 School Management System - Demo Setup

## 🚀 Quick Start

Start both backend and frontend together:

```bash
npm run full
```

This will start:
- **Backend API**: http://localhost:5000
- **Frontend App**: http://localhost:3000

## 🔐 Demo Accounts 

All demo accounts are ready to use with role-based authentication:

| **Role** | **Email** | **Password** | **Features** |
|----------|-----------|-------------|--------------|
| **👑 Administrator** | `admin@school.com` | `Admin123` | Complete school management, user management, reports |
| **👩‍🏫 Teacher** | `teacher@school.com` | `Teacher123` | Class management, student assessment, attendance |
| **👨‍🎓 Student** | `student@school.com` | `Student123` | Learning portal, assignments, grades, schedule |
| **👨‍👩‍👧 Parent** | `parent@school.com` | `Parent123` | Child progress monitoring, fees, communication |
| **💰 Accountant** | `accountant@school.com` | `Account123` | Financial management, fee collection, reports |
| **📚 Librarian** | `librarian@school.com` | `Library123` | Library management, book inventory, member tracking |

## 🎭 How to Test

1. Visit: http://localhost:3000/login
2. Click "Demo Accounts" tab
3. Click any role button (Administrator, Teacher, etc.)
4. Credentials will auto-fill
5. Click "Sign In" to test role-based access

## 📁 Project Structure

```
SMS/
├── package.json          # Root package with "npm run full" script
├── backend/              # Express API + MongoDB
├── frontend/             # React + TypeScript + Vite
└── demo-credentials.json # Complete credentials reference
```

## 🛠️ Individual Server Commands

### Backend Only
```bash
cd backend
npm run dev
```

### Frontend Only  
```bash
cd frontend
npm run dev
```

## 🎯 Features Implemented

- ✅ **Role-Based Authentication**: 6 different user roles with unique permissions
- ✅ **Enterprise Security**: JWT tokens, rate limiting, CORS, helmet
- ✅ **Modern Frontend**: React + TypeScript, TailwindCSS, shadcn/ui
- ✅ **Professional Backend**: Express.js, MongoDB, comprehensive logging
- ✅ **Demo System**: One-click login for testing all user roles
- ✅ **Production Ready**: Error handling, validation, monitoring

## 🎉 Success!

Your School Management System is now a **commercial-grade application** with:
- Complete role-based access control
- Professional UI/UX design  
- Robust backend architecture
- Easy demo testing system

Ready to sell! 🏆