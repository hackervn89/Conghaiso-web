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
import DraftListPage from './pages/drafts/DraftListPage';
import DraftDetailPage from './pages/drafts/DraftDetailPage';
import AiChatPage from './pages/AI/AiChatPage';
import KnowledgeManagementPage from './pages/AI/KnowledgeManagementPage';
import AnchorKeywordManagementPage from './pages/AI/AnchorKeywordManagementPage';

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
      },
      {
        path: "du-thao",
        element: <DraftListPage />,
      },
      {
        path: "du-thao/:draftId",
        element: <DraftDetailPage />,
      },
      // Task FEW-05: Route cho người dùng
      {
        path: "ai-assistant",
        element: <AiChatPage />,
      },
      // Task FEW-01: Route cho admin, được bảo vệ bởi logic trong DashboardLayout
      {
        path: "admin/knowledge",
        element: <KnowledgeManagementPage />,
      },
      // Route mới cho quản lý từ khóa neo
      {
        path: "admin/anchor-keywords",
        element: <AnchorKeywordManagementPage />,
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
