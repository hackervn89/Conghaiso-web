import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';
import MeetingFormModal from '../components/MeetingFormModal';
import NotificationModal from '../components/NotificationModal';
import qrcode from 'qrcode.react';
import AttendanceStats from '../components/AttendanceStats'; // Import component mới
import { SparklesIcon } from '@heroicons/react/24/outline';

const QrCodeModal = ({ isOpen, onClose, meetingId }) => {
    const [qrCodeImage, setQrCodeImage] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isOpen && meetingId) {
            setLoading(true);
            apiClient.get(`/meetings/${meetingId}/qr-code`)
                .then(response => setQrCodeImage(response.data.qrCodeImage))
                .catch(err => console.error("Lỗi khi tạo mã QR", err))
                .finally(() => setLoading(false));
        }
    }, [isOpen, meetingId]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
            <div className="bg-white p-8 rounded-lg shadow-xl" onClick={e => e.stopPropagation()}>
                <h2 className="text-2xl font-bold text-center text-primaryRed mb-4">Điểm danh bằng mã QR</h2>
                <p className="text-center text-gray-600 mb-6">Sử dụng ứng dụng di động để quét mã này.</p>
                <div className="flex justify-center">
                    {loading ? <p>Đang tạo mã...</p> : <img src={qrCodeImage} alt="Mã QR điểm danh" />}
                </div>
            </div>
        </div>
    );
};

const SummaryModal = ({ isOpen, onClose, summary, loading }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
            <div className="bg-white p-8 rounded-lg shadow-xl max-w-2xl w-full" onClick={e => e.stopPropagation()}>
                <h2 className="text-2xl font-bold text-center text-primaryRed mb-4">TÓM TẮT TÀI LIỆU</h2>
                <h4 className="text-center text-primaryRed mb-4">Tài liệu được tóm tắt bằng AI, hãy kiểm tra lại thông tin trước khi sử dụng</h4>
                <div className="max-h-96 overflow-y-auto">
                    {loading ? <p>Đang tóm tắt...</p> : <p className="text-gray-700 whitespace-pre-wrap">{summary}</p>}
                </div>
                <div className="text-right mt-6">
                    <button onClick={onClose} className="px-4 py-2 font-semibold text-white bg-primaryRed rounded-md hover:bg-red-700">
                        Đóng
                    </button>
                </div>
            </div>
        </div>
    );
};

const MeetingDetailPage = () => {
    const { id } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [meeting, setMeeting] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isNotifyModalOpen, setIsNotifyModalOpen] = useState(false);
    const [isQrModalOpen, setIsQrModalOpen] = useState(false);
    const [isAttendeesListVisible, setIsAttendeesListVisible] = useState(true);
    const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
    const [summaryContent, setSummaryContent] = useState('');
    const [isSummaryLoading, setIsSummaryLoading] = useState(false);
    const [isSummarizing, setIsSummarizing] = useState(false); // New state for rate limiting
    const [lastSummarizeTime, setLastSummarizeTime] = useState(0); // New state for cooldown
    const COOLDOWN_PERIOD = 60000; // 60 seconds cooldown (to align with backend retry-after)

    const fetchMeetingDetails = useCallback(async () => {
        try {
            const response = await apiClient.get(`/meetings/${id}`);
            setMeeting(response.data);
        } catch (err) {
            setError('Không thể tải thông tin chi tiết cuộc họp.');
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchMeetingDetails();
    }, [fetchMeetingDetails]);

    const handleUpdateAttendance = async (userId, status) => {
        const originalMeeting = { ...meeting };

        // Optimistic UI Update
        const updatedAttendees = meeting.attendees.map(attendee => 
            attendee.user_id === userId ? { ...attendee, status: status } : attendee
        );
        setMeeting({ ...meeting, attendees: updatedAttendees });

        try {
            await apiClient.post(`/meetings/${id}/attendance`, { userId, status });
            // Không cần fetch lại dữ liệu vì UI đã được cập nhật
        } catch (err) {
            alert('Cập nhật điểm danh thất bại. Đang hoàn tác...');
            // Hoàn tác lại nếu có lỗi
            setMeeting(originalMeeting);
        }
    };
    
    const handleDeleteMeeting = async () => {
        if (window.confirm(`Bạn có chắc chắn muốn xóa cuộc họp "${meeting.title}" không?`)) {
            try {
                await apiClient.delete(`/meetings/${id}`);
                alert('Xóa cuộc họp thành công!');
                navigate('/meetings');
            } catch (err) {
                alert('Xóa cuộc họp thất bại.');
            }
        }
    };
    
    const handleSaveMeeting = (savedMeeting) => {
        setMeeting(savedMeeting);
    };

    const handleSummarize = async (filePath) => {
        if (isSummarizing) {
            alert("Đang có yêu cầu tóm tắt khác đang xử lý. Vui lòng đợi.");
            return;
        }
        if (Date.now() - lastSummarizeTime < COOLDOWN_PERIOD) {
            const remainingTime = Math.ceil((COOLDOWN_PERIOD - (Date.now() - lastSummarizeTime)) / 1000);
            alert(`Vui lòng đợi ${remainingTime} giây trước khi tóm tắt tài liệu khác.`);
            return;
        }

        if (!filePath) {
            alert("Tài liệu này chưa có file đính kèm để tóm tắt.");
            return;
        }

        setIsSummaryModalOpen(true);
        setIsSummaryLoading(true);
        setSummaryContent('');
        setIsSummarizing(true);

        try {
            // Gửi thẳng filePath lên cho backend
            const summaryResponse = await apiClient.post('/summarize', { filePath });
            setSummaryContent(summaryResponse.data.summary);
        } catch (error) {
            setSummaryContent('Không thể tóm tắt tài liệu. Vui lòng thử lại sau.');
        } finally {
            setIsSummaryLoading(false);
            setIsSummarizing(false);
            setLastSummarizeTime(Date.now());
        }
    };

    const handleOpenDocument = (filePath) => {
        if (!filePath) {
            alert("Tài liệu này không có file đính kèm.");
            return;
        }
        // Lấy baseURL từ apiClient và tạo URL để mở trong tab mới
        const fileUrl = `${apiClient.defaults.baseURL}/files/view?path=${encodeURIComponent(filePath)}`;
        window.open(fileUrl, '_blank');
    };

    const formatDateTime = (isoString) => {
        if (!isoString) return 'Chưa xác định';
        const date = new Date(isoString);
        return date.toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' });
    };

    if (loading) return <div>Đang tải dữ liệu...</div>;
    if (error) return <div className="text-red-500">{error}</div>;
    if (!meeting) return <div>Không tìm thấy cuộc họp.</div>;
    
    const canEditMeeting = user?.role === 'Admin' || (user?.role === 'Secretary' && user.managedScopes.includes(meeting.org_id));
    const canManageAttendance = canEditMeeting || user?.userId === meeting.chairperson_id || user?.userId === meeting.meeting_secretary_id;

    const getStatusBadge = (status) => {
        switch (status) {
            case 'present': return <span className="px-2 py-1 text-xs font-semibold text-green-800 bg-green-200 rounded-full">Có mặt</span>;
            case 'absent': return <span className="px-2 py-1 text-xs font-semibold text-red-800 bg-red-200 rounded-full">Vắng KP</span>;
            case 'absent_with_reason': return <span className="px-2 py-1 text-xs font-semibold text-yellow-800 bg-yellow-200 rounded-full">Vắng CP</span>;
            default: return <span className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-200 rounded-full">Chưa điểm danh</span>;
        }
    };


    return (
        <div>
            <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex justify-between items-start mb-6 pb-6 border-b flex-wrap gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-primaryRed">{meeting.title}</h1>
                        <div className="flex items-center text-gray-500 mt-2 space-x-6 flex-wrap">
                            <span><strong>Địa điểm:</strong> {meeting.location}</span>
                            <span><strong>Bắt đầu:</strong> {formatDateTime(meeting.start_time)}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                        {canManageAttendance && (
                            <button onClick={() => setIsQrModalOpen(true)} className="px-4 py-2 font-semibold text-white bg-green-500 rounded-md hover:bg-green-600">
                                Điểm danh bằng QR
                            </button>
                        )}
                         {canEditMeeting && (
                            <>
                                <button onClick={() => setIsNotifyModalOpen(true)} className="px-4 py-2 font-semibold text-white bg-blue-500 rounded-md hover:bg-blue-600">
                                    Gửi Thông báo
                                </button>
                                <button onClick={() => setIsEditModalOpen(true)} className="px-4 py-2 font-semibold text-white bg-primaryRed rounded-md hover:bg-red-700">
                                    Sửa
                                </button>
                                <button onClick={handleDeleteMeeting} className="px-4 py-2 font-semibold text-white bg-primaryRed rounded-md hover:bg-red-700">
                                    Xóa
                                </button>
                            </>
                        )}
                        <Link to="/meetings" className="text-primaryRed hover:underline">{'< Quay lại'}</Link>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-6">
                    <div className="md:col-span-2">
                        <h2 className="text-xl font-semibold text-primaryRed border-b pb-2 mb-4">Chương trình nghị sự</h2>
                        {meeting.agenda?.length > 0 ? (
                            <div className="space-y-4">
                                {meeting.agenda.map((item, index) => (
                                    <div key={item.agenda_id} className="p-4 bg-gray-50 rounded-md border">
                                        <p className="font-semibold">{index + 1}. {item.title}</p>
                                        {item.documents?.length > 0 && (
                                            <div className="mt-3 space-y-2">
                                                {item.documents.map(doc => (
                                                    <div key={doc.doc_id} className="flex items-center justify-between p-2 rounded-md bg-white hover:bg-blue-50 border">
                                                        <button onClick={() => handleOpenDocument(doc.filePath)} className="flex items-center text-left">
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-primaryRed" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                                            <span className="text-primaryRed">{doc.doc_name}</span>
                                                        </button>
                                                        <button onClick={() => handleSummarize(doc.filePath)} disabled={isSummarizing || (Date.now() - lastSummarizeTime < COOLDOWN_PERIOD)} className="flex items-center px-3 py-1 text-sm text-white bg-purple-500 rounded-md hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed">
                                                             <SparklesIcon className="h-4 w-4 mr-1" />
                                                             Tóm tắt
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : <p className="text-gray-500">Chưa có chương trình nghị sự.</p>}
                    </div>
                    <div>
                        {canManageAttendance && <AttendanceStats meetingId={id} />}

                        <div className="mt-6">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-semibold text-primaryRed border-b pb-2">Người tham dự ({meeting.attendees?.length > 0 && meeting.attendees[0] !== null ? meeting.attendees.length : 0})</h2>
                                <button onClick={() => setIsAttendeesListVisible(!isAttendeesListVisible)} className="text-primaryRed hover:text-red-700 font-semibold text-sm">
                                    {isAttendeesListVisible ? 'Ẩn danh sách' : 'Hiện danh sách'}
                                </button>
                            </div>
                            {isAttendeesListVisible && (
                                meeting.attendees?.length > 0 && meeting.attendees[0] !== null ? (
                                    <div className="space-y-1">
                                        {meeting.attendees
                                            .filter(attendee => attendee.full_name !== 'Quản trị viên Hệ thống' && !attendee.full_name.startsWith('Văn thư'))
                                            .map(attendee => (
                                            <div key={attendee.user_id} className="p-2 bg-gray-50 rounded-md flex items-center justify-between">
                                                <div className='flex-1'>
                                                    <p className='font-medium text-gray-800'>{attendee.full_name}</p>
                                                    <div className='mt-1'>{getStatusBadge(attendee.status)}</div>
                                                </div>
                                                {canManageAttendance && (
                                                     <div className="flex gap-1">
                                                        <button onClick={() => handleUpdateAttendance(attendee.user_id, 'present')} className="p-1.5 rounded bg-green-200 text-green-800 hover:bg-green-300 text-xs">Có mặt</button>
                                                        <button onClick={() => handleUpdateAttendance(attendee.user_id, 'absent')} className="p-1.5 rounded bg-red-200 text-red-800 hover:bg-red-300 text-xs">Vắng KP</button>
                                                        <button onClick={() => handleUpdateAttendance(attendee.user_id, 'absent_with_reason')} className="p-1.5 rounded bg-yellow-200 text-yellow-800 hover:bg-yellow-300 text-xs">Vắng CP</button>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : <p className="text-gray-500">Chưa có người tham dự.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <MeetingFormModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} onSave={handleSaveMeeting} initialData={meeting} />
            <NotificationModal isOpen={isNotifyModalOpen} onClose={() => setIsNotifyModalOpen(false)} meetingId={id} />
            <QrCodeModal isOpen={isQrModalOpen} onClose={() => setIsQrModalOpen(false)} meetingId={id} />
            <SummaryModal isOpen={isSummaryModalOpen} onClose={() => setIsSummaryModalOpen(false)} summary={summaryContent} loading={isSummaryLoading} />
        </div>
    );
};

export default MeetingDetailPage;

