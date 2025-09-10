import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/client';
import MeetingFormModal from '../components/MeetingFormModal';

const MeetingManagementPage = () => {
    const [meetings, setMeetings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentMeeting, setCurrentMeeting] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchMeetings = async () => {
            try {
                const response = await apiClient.get('/meetings');
                setMeetings(response.data);
            } catch (err) {
                setError('Không thể tải danh sách cuộc họp.');
            } finally {
                setLoading(false);
            }
        };
        fetchMeetings();
    }, []);

    const handleSaveMeeting = (savedMeeting) => {
        if (currentMeeting) {
            setMeetings(meetings.map(m => m.meeting_id === savedMeeting.meeting_id ? savedMeeting : m));
        } else {
            setMeetings([...meetings, savedMeeting]);
        }
    };

    const handleDeleteMeeting = async (meetingId, title) => {
        if (window.confirm(`Bạn có chắc chắn muốn xóa cuộc họp "${title}" không?`)) {
            try {
                await apiClient.delete(`/meetings/${meetingId}`);
                setMeetings(meetings.filter(m => m.meeting_id !== meetingId));
            } catch (err) {
                alert('Xóa cuộc họp thất bại.');
            }
        }
    };

    const openModal = (meeting = null) => {
        setCurrentMeeting(meeting);
        setIsModalOpen(true);
    };

    const formatDateTime = (isoString) => {
        if (!isoString) return 'N/A';
        const date = new Date(isoString);
        return date.toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    if (loading) return <div>Đang tải danh sách cuộc họp...</div>;
    if (error) return <div className="text-red-500">{error}</div>;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-primaryRed">Quản lý Cuộc họp</h1>
                <button 
                    onClick={() => openModal()}
                    className="px-4 py-2 font-bold text-white bg-primaryRed rounded-md hover:bg-red-700 flex items-center gap-2"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>
                    Tạo cuộc họp mới
                </button>
            </div>
            
            <div className="bg-white shadow-md rounded-lg overflow-hidden">
                <table className="min-w-full leading-normal table-fixed">
                    <thead>
                        <tr className="bg-primaryRed text-left text-white uppercase text-sm">
                            <th className="px-5 py-3 border-b-2 border-red-700 w-2/5">Tiêu đề</th>
                            <th className="px-5 py-3 border-b-2 border-red-700 w-1/5">Địa điểm</th>
                            <th className="px-5 py-3 border-b-2 border-red-700 w-1/5">Thời gian bắt đầu</th>
                            <th className="px-5 py-3 border-b-2 border-red-700 text-center w-1/5">Hành động</th>
                        </tr>
                    </thead>
                    <tbody>
                        {meetings.map((meeting) => (
                            <tr 
                                key={meeting.meeting_id} 
                                className="hover:bg-gray-100"
                            >
                                <td onClick={() => navigate(`/meetings/${meeting.meeting_id}`)} className="px-5 py-4 border-b border-gray-200 text-sm cursor-pointer truncate">{meeting.title}</td>
                                <td onClick={() => navigate(`/meetings/${meeting.meeting_id}`)} className="px-5 py-4 border-b border-gray-200 text-sm cursor-pointer truncate">{meeting.location}</td>
                                <td onClick={() => navigate(`/meetings/${meeting.meeting_id}`)} className="px-5 py-4 border-b border-gray-200 text-sm cursor-pointer">{formatDateTime(meeting.start_time)}</td>
                                <td className="px-5 py-4 border-b border-gray-200 text-sm text-center space-x-2" onClick={(e) => e.stopPropagation()}> 
                                    <button onClick={() => navigate(`/meetings/${meeting.meeting_id}`)} className="text-gray-600 hover:text-primaryRed p-2 rounded-full" title="Xem chi tiết">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z" /><path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.022 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" /></svg>
                                    </button>
                                    <button onClick={() => openModal(meeting)} className="text-gray-600 hover:text-primaryRed p-2 rounded-full" title="Sửa">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" /></svg>
                                    </button>
                                    <button onClick={() => handleDeleteMeeting(meeting.meeting_id, meeting.title)} className="text-red-600 hover:text-red-800 p-2 rounded-full" title="Xóa">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" /></svg>
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <MeetingFormModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSaveMeeting}
                initialData={currentMeeting}
            />
        </div>
    );
};

export default MeetingManagementPage;