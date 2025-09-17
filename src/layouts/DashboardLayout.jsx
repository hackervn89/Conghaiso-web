import React, { useState } from 'react';
import { NavLink, Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logoImage from '../assets/logo.png'; // Import a logo

// Logo Component
const Logo = () => (
    <img src={logoImage} alt="Công Hải Số Logo" className="h-10 w-auto" />
);

// Sidebar Header Component
const SidebarHeader = () => (
    <div className="flex items-center p-4 border-b border-gray-200">
        <Logo />
        <h1 className="ml-3 text-xl font-bold text-primaryRed">CÔNG HẢI SỐ</h1>
    </div>
);


// Sidebar Component
const Sidebar = ({ user, isSidebarOpen }) => {
    const menuItems = [
        { to: "/", text: "Dashboard", icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>, adminOnly: false },
        { to: "/tasks", text: "Quản lý Công việc", icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>, adminOnly: false },
        { to: "/meetings", text: "Quản lý Cuộc họp", icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>, adminOnly: false },
        { to: "/users", text: "Quản lý Người dùng", icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M15 21v-2a6 6 0 00-12 0v2z" /></svg>, adminOnly: true },
        { to: "/organizations", text: "Quản lý Cơ quan", icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m-1 4h1m3-4h1m-1 4h1m-1-4h1m-1 4h1" /></svg>, adminOnly: true },
    ];

    return (
        <aside className={`absolute inset-y-0 left-0 bg-white shadow-md w-64 transform transition-transform duration-300 ease-in-out z-30 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0`}>
            <SidebarHeader />
            <nav className="mt-4">
                {menuItems.map(item => (
                    (!item.adminOnly || user?.role === 'Admin') && (
                        <NavLink 
                            key={item.to}
                            to={item.to} 
                            end={item.to === "/"}
                            className={({ isActive }) => `flex items-center px-6 py-3 text-base transition-colors ${isActive ? 'bg-red-100 text-primaryRed font-semibold' : 'text-gray-700 hover:bg-red-50'}`}
                        >
                            {item.icon}
                            <span className="ml-4">{item.text}</span>
                        </NavLink>
                    )
                ))}
            </nav>
        </aside>
    );
};


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
                <header className="flex justify-between items-center p-4 bg-white shadow-md h-16">
                    <div className="flex items-center">
                        <button 
                            className="text-gray-500 focus:outline-none md:hidden"
                            onClick={() => setSidebarOpen(true)}
                        >
                            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </button>
                        <div className="ml-4 md:hidden">
                            <Logo />
                        </div>
                    </div>
                    
                    <div className="flex items-center">
                        <span className="mr-4 text-gray-700">Chào đồng chí, <span className="font-semibold text-primaryRed">{user?.fullName}</span></span>
                        <button
                            onClick={signOut}
                            className="p-2 md:px-4 md:py-2 font-bold text-white bg-primaryRed rounded-md hover:bg-red-700 flex items-center gap-2"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            <span className="hidden md:inline">Đăng xuất</span>
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
