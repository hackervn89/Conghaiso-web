import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = () => {
    const { user, loading } = useAuth();

    if (loading) {
        return <div>Đang tải...</div>; // Hoặc một component loading đẹp hơn
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    return <Outlet />; // Hiển thị các trang con nếu đã đăng nhập
};

export default ProtectedRoute;