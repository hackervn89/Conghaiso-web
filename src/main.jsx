import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import './index.css'
import { AuthProvider } from './context/AuthContext';

// Import các trang và layout
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import DashboardLayout from './layouts/DashboardLayout';
import UserManagementPage from './pages/UserManagementPage';
import MeetingManagementPage from './pages/MeetingManagementPage';
import MeetingDetailPage from './pages/MeetingDetailPage';
import OrganizationManagementPage from './pages/OrganizationManagementPage';
import TaskManagementPage from './pages/TaskManagementPage';

// Cấu trúc router hoàn chỉnh
const router = createBrowserRouter([
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/",
    element: <DashboardLayout />,
    children: [
      {
        path: "",
        element: <DashboardPage />,
      },
      {
        path: "users",
        element: <UserManagementPage />,
      },
      {
        path: "meetings",
        element: <MeetingManagementPage />,
      },
      {
        path: "meetings/:id",
        element: <MeetingDetailPage />,
      },
      {
        path: "organizations", 
        element: <OrganizationManagementPage />,
      },
      {
        path: "tasks",
        element: <TaskManagementPage />,
      }
    ],
  },
]);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </React.StrictMode>,
)
