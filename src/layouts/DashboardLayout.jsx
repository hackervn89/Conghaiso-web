import React, { useState } from 'react';
import { NavLink, Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Component con cho Sidebar để mã nguồn sạch sẽ hơn
const Sidebar = ({ user, isSidebarOpen }) => (
    <aside className={`absolute inset-y-0 left-0 bg-white shadow-md w-64 transform transition-transform duration-300 ease-in-out z-30 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0`}>
        <div className="p-6">
            <h1 className="text-2xl font-bold text-primaryRed">PHÒNG HỌP SỐ</h1>
        </div>
        <nav className="mt-6">
            <NavLink to="/" end className={({ isActive }) => `flex items-center px-6 py-3 text-lg ${isActive ? 'bg-red-100 text-primaryRed' : 'text-gray-700 hover:bg-gray-200'}`}>
                Dashboard
            </NavLink>
            <NavLink to="/tasks" className={({ isActive }) => `flex items-center px-6 py-3 text-lg ${isActive ? 'bg-red-100 text-primaryRed' : 'text-gray-700 hover:bg-gray-200'}`}>
                Quản lý Công việc
            </NavLink>
            <NavLink to="/meetings" className={({ isActive }) => `flex items-center px-6 py-3 text-lg ${isActive ? 'bg-red-100 text-primaryRed' : 'text-gray-700 hover:bg-gray-200'}`}>
                Quản lý Cuộc họp
            </NavLink>
            {user?.role === 'Admin' && (
              <>
                <NavLink to="/users" className={({ isActive }) => `flex items-center px-6 py-3 text-lg ${isActive ? 'bg-red-100 text-primaryRed' : 'text-gray-700 hover:bg-gray-200'}`}>
                    Quản lý Người dùng
                </NavLink>
                <NavLink to="/organizations" className={({ isActive }) => `flex items-center px-6 py-3 text-lg ${isActive ? 'bg-red-100 text-primaryRed' : 'text-gray-700 hover:bg-gray-200'}`}>
                    Quản lý Cơ quan
                </NavLink>
              </>
            )}
        </nav>
    </aside>
);


const DashboardLayout = () => {
    const { user, loading, signOut } = useAuth();
    const [isSidebarOpen, setSidebarOpen] = useState(false);

    if (loading) {
        return <div className="flex items-center justify-center h-screen">Đang tải...</div>;
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    return (
        <div className="relative min-h-screen md:flex">
            {isSidebarOpen && (
                <div 
                    className="fixed inset-0 bg-black opacity-50 z-20 md:hidden"
                    onClick={() => setSidebarOpen(false)}
                ></div>
            )}

            <Sidebar user={user} isSidebarOpen={isSidebarOpen} />

            <div className="flex-1 flex flex-col">
                <header className="flex justify-between items-center p-4 bg-white shadow-md">
                    <button 
                        className="text-gray-500 focus:outline-none md:hidden"
                        onClick={() => setSidebarOpen(true)}
                    >
                        <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </button>
                    
                    <div className="flex items-center ml-auto">
                        <span className="mr-4 text-gray-700">Chào đồng chí, <span className="font-semibold text-primaryRed">{user?.fullName}</span></span>
                        <button
                            onClick={signOut}
                            className="px-4 py-2 font-bold text-white bg-primaryRed rounded-md hover:bg-red-700"
                        >
                            Đăng xuất
                        </button>
                    </div>
                </header>
                <main className="flex-1 p-6 overflow-y-auto bg-gray-100">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default DashboardLayout;

