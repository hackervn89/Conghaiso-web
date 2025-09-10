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
import OrganizationManagementPage from './pages/OrganizationManagementPage'; // <-- Import trang mới

// Cấu trúc router hoàn chỉnh
const router = createBrowserRouter([
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/",
    element: <DashboardLayout />, // Sử dụng DashboardLayout làm layout chính và "cổng" bảo vệ
    children: [
      {
        path: "", // Trang mặc định
        element: <DashboardPage />,
      },
      {
        path: "users", // Trang Quản lý Người dùng
        element: <UserManagementPage />,
      },
      {
        path: "meetings", // Trang Quản lý Cuộc họp
        element: <MeetingManagementPage />,
      },
      {
        path: "meetings/:id", // Trang Chi tiết Cuộc họp
        element: <MeetingDetailPage />,
      },
      {
        path: "organizations", // <-- Thêm route cho trang Quản lý Cơ quan
        element: <OrganizationManagementPage />,
      },
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