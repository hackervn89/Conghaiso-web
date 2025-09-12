import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import apiClient from '../api/client';

// Component Lịch đã được phục hồi
const Calendar = ({ meetings }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

    const calendarDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    const emptyDays = Array.from({ length: firstDayOfMonth });

    const changeMonth = (offset) => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1));
    };

    const weekDays = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <button onClick={() => changeMonth(-1)} className="p-2 rounded-full hover:bg-gray-200 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                </button>
                <h3 className="text-lg font-semibold text-gray-800">
                    Tháng {currentDate.getMonth() + 1}, {currentDate.getFullYear()}
                </h3>
                <button onClick={() => changeMonth(1)} className="p-2 rounded-full hover:bg-gray-200 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                </button>
            </div>
            <div className="grid grid-cols-7 gap-2 text-center">
                {weekDays.map(day => <div key={day} className="font-bold text-gray-600 text-sm">{day}</div>)}
                {emptyDays.map((_, i) => <div key={`empty-${i}`}></div>)}
                {calendarDays.map(day => {
                    const checkDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
                    const meetingsOnThisDay = meetings.filter(meeting => {
                        const meetingDate = new Date(meeting.start_time);
                        meetingDate.setHours(0, 0, 0, 0);
                        return checkDate.getTime() === meetingDate.getTime();
                    });
                    const status = meetingsOnThisDay.length > 0 ? (checkDate < today ? 'past' : 'upcoming') : null;

                    let dayClass = "relative w-10 h-10 flex items-center justify-center rounded-full text-sm transition-colors";
                    if (status === 'past') {
                        dayClass += " bg-gray-300 text-gray-600";
                    } else if (status === 'upcoming') {
                        dayClass += " bg-primaryRed text-white font-bold cursor-pointer";
                    } else {
                        dayClass += " hover:bg-red-100";
                    }
                    const isToday = checkDate.getTime() === today.getTime();
                    if(isToday && !status) {
                        dayClass += " border-2 border-primaryRed";
                    }
                    return (
                        <div key={day} className={`group ${dayClass}`}>
                            {day}
                            {meetingsOnThisDay.length > 0 && (
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-xs p-2 bg-gray-800 text-white text-xs rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                                    {meetingsOnThisDay.map(m => <p key={m.meeting_id} className="truncate">- {m.title}</p>)}
                                    <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-gray-800"></div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};


const StatCard = ({ title, value, icon, linkTo }) => {
    const content = (
        <div className="bg-white p-6 rounded-lg shadow-md flex items-center h-full hover:shadow-lg transition-shadow">
            <div className="bg-red-100 p-3 rounded-full mr-4">
                {icon}
            </div>
            <div>
                <p className="text-gray-500 text-sm">{title}</p>
                <p className="text-2xl font-bold text-gray-800">{value}</p>
            </div>
        </div>
    );

    return linkTo ? <Link to={linkTo}>{content}</Link> : content;
};

const DashboardPage = () => {
    const { user } = useAuth();
    const [meetings, setMeetings] = useState([]);
    const [stats, setStats] = useState({ meetingsThisMonth: 0, totalUsers: 0, overdueTasks: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const [meetingsResponse, statsResponse] = await Promise.all([
                    apiClient.get('/meetings'),
                    apiClient.get('/dashboard/stats')
                ]);
                
                setMeetings(meetingsResponse.data);
                setStats(statsResponse.data);

            } catch (error) {
                console.error("Không thể tải dữ liệu cho dashboard:", error);
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            fetchDashboardData();
        }
    }, [user]);
    
    const formatDateTime = (isoString) => {
        if (!isoString) return 'N/A';
        const date = new Date(isoString);
        return date.toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    };
    
    // Giao diện cho Admin và Văn thư (Đã được phục hồi)
    const AdminSecretaryDashboard = () => (
         <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard 
                    title="Công việc trễ hạn" 
                    value={stats.overdueTasks || 0} 
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primaryRed" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                    linkTo="/tasks"
                />
                <StatCard 
                    title="Cuộc họp tháng này" 
                    value={stats.meetingsThisMonth || 0} 
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primaryRed" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>} 
                />
                {user?.role === 'Admin' && (
                    <StatCard 
                        title="Tổng số người dùng" 
                        value={stats.totalUsers || 0} 
                        icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primaryRed" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M15 21v-2a6 6 0 00-12 0v2z" /></svg>} 
                    />
                )}
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold text-primaryRed border-b pb-2 mb-4">Các cuộc họp sắp tới</h2>
                 <div className="space-y-4">
                    {meetings.filter(m => new Date(m.start_time) >= new Date()).slice(0, 5).length > 0 ? meetings.filter(m => new Date(m.start_time) >= new Date()).slice(0, 5).map(meeting => (
                        <Link to={`/meetings/${meeting.meeting_id}`} key={meeting.meeting_id} className="block p-4 rounded-md hover:bg-gray-100 border transition-colors">
                            <p className="font-bold text-gray-800">{meeting.title}</p>
                            <div className="text-sm text-gray-500 mt-1">
                                <span>{formatDateTime(meeting.start_time)}</span> | <span>{meeting.location}</span>
                            </div>
                        </Link>
                    )) : <p>Không có cuộc họp nào sắp tới.</p>}
                </div>
            </div>
        </div>
    );

    // Giao diện cho Người tham dự (Đã được phục hồi)
    const AttendeeDashboard = () => (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
             <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold text-primaryRed border-b pb-2 mb-4">Các cuộc họp sắp tới</h2>
                <div className="space-y-4">
                    {meetings.filter(m => new Date(m.start_time) >= new Date()).length > 0 
                    ? meetings.filter(m => new Date(m.start_time) >= new Date()).map(meeting => (
                        <Link to={`/meetings/${meeting.meeting_id}`} key={meeting.meeting_id} className="block p-4 rounded-md hover:bg-gray-100 border transition-colors">
                            <p className="font-bold text-gray-800">{meeting.title}</p>
                            <p className="text-sm text-gray-500 mt-1">{formatDateTime(meeting.start_time)}</p>
                        </Link>
                    )) : <p>Không có cuộc họp nào sắp tới.</p>}
                </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold text-primaryRed border-b pb-2 mb-4">Lịch họp</h2>
                <Calendar meetings={meetings} />
            </div>
        </div>
    );

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-primaryRed">Chào đồng chí, {user?.fullName}!</h1>
                <p className="text-gray-500 mt-1">Đây là thông tin tổng quan về các hoạt động của bạn.</p>
            </div>
            {loading ? <p>Đang tải dữ liệu dashboard...</p> : (
                // Logic hiển thị theo vai trò người dùng
                (user?.role === 'Admin' || user?.role === 'Secretary') 
                    ? <AdminSecretaryDashboard /> 
                    : <AttendeeDashboard />
            )}
        </div>
    );
};

export default DashboardPage;

