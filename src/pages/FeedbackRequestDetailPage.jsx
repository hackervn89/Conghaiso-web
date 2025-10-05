import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowDownTrayIcon, CheckCircleIcon, ChatBubbleLeftEllipsisIcon, EllipsisHorizontalCircleIcon } from '@heroicons/react/24/solid';

// Mock data for UI development
const mockDetail = {
    id: 1,
    title: 'Dự thảo Nghị định về quản lý ABC',
    creator: 'Nguyễn Văn A',
    createdAt: '2025-10-05T08:00:00Z',
    deadline: '2025-10-20T17:00:00Z',
    document: { name: 'duthao_nghi_dinh_ABC_v1.2.docx', url: '#' },
    participants: [
        { id: 1, name: 'Nguyễn Văn A', avatar: 'https://i.pravatar.cc/150?u=a', status: 'da_gop_y' },
        { id: 2, name: 'Trần Thị B', avatar: 'https://i.pravatar.cc/150?u=b', status: 'da_thong_nhat' },
        { id: 3, name: 'Lê Văn C', avatar: 'https://i.pravatar.cc/150?u=c', status: 'cho_y_kien' },
        { id: 4, name: 'Phạm Thị D', avatar: 'https://i.pravatar.cc/150?u=d', status: 'cho_y_kien' },
    ],
    comments: [
        { id: 1, user: { name: 'Nguyễn Văn A', avatar: 'https://i.pravatar.cc/150?u=a' }, time: '09:30 06/10/2025', content: 'Đề nghị xem xét lại Điều 5, Khoản 2 về thẩm quyền.' },
    ],
};

// Assume current user's status is 'cho_y_kien' for demonstration
const currentUserStatus = 'cho_y_kien';

const formatDate = (isoString) => {
    if (!isoString) return 'N/A';
    const date = new Date(isoString);
    return date.toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const isOverdue = (dateString) => {
    return new Date(dateString) < new Date();
};

const getStatusIcon = (status) => {
    switch (status) {
        case 'da_thong_nhat':
            return <CheckCircleIcon className="h-5 w-5 text-green-500" title="Đã thống nhất" />;
        case 'da_gop_y':
            return <ChatBubbleLeftEllipsisIcon className="h-5 w-5 text-blue-500" title="Đã góp ý" />;
        case 'cho_y_kien':
            return <EllipsisHorizontalCircleIcon className="h-5 w-5 text-gray-400" title="Chờ ý kiến" />;
        default:
            return null;
    }
};

const FeedbackRequestDetailPage = () => {
    const { id } = useParams();
    const [detail, setDetail] = useState(mockDetail);
    // In a real app, you would fetch data based on `id`

    const handleAction = (action) => {
        alert(`Hành động được thực hiện: ${action}`);
        // Here you would call the API to update the status
    };

    if (!detail) return <div>Đang tải...</div>;

    return (
        <div>
            <div className="mb-4">
                <Link to="/gop-y-du-thao" className="text-primaryRed hover:underline">{'< Quay lại danh sách'}</Link>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column */}
                <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-md">
                    <h1 className="text-3xl font-bold text-primaryRed mb-4">{detail.title}</h1>
                    <div className="flex items-center text-gray-500 text-sm space-x-4 mb-6 pb-6 border-b">
                        <span>Người tạo: <strong>{detail.creator}</strong></span>
                        <span>|</span>
                        <span>Ngày tạo: <strong>{formatDate(detail.createdAt)}</strong></span>
                        <span>|</span>
                        <span className={isOverdue(detail.deadline) ? 'text-red-600 font-semibold' : ''}>
                            Hạn chót: <strong>{formatDate(detail.deadline)}</strong>
                        </span>
                    </div>

                    <div className="mb-8">
                        <h3 className="text-lg font-semibold text-gray-800 mb-3">Tài liệu đính kèm</h3>
                        <a href={detail.document.url} download className="inline-flex items-center gap-2 p-3 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors">
                            <ArrowDownTrayIcon className="h-5 w-5 text-primaryRed" />
                            <span className="font-medium text-gray-700">{detail.document.name}</span>
                        </a>
                    </div>

                    {/* Action Area */}
                    <div className="mb-8">
                        {currentUserStatus === 'cho_y_kien' ? (
                            <div className="flex gap-4">
                                <button onClick={() => handleAction('Thống nhất')} className="px-8 py-3 font-bold text-white bg-green-500 rounded-md hover:bg-green-600 transition-colors">
                                    Thống nhất
                                </button>
                                <button onClick={() => handleAction('Gửi ý kiến')} className="px-8 py-3 font-bold text-white bg-blue-500 rounded-md hover:bg-blue-600 transition-colors">
                                    Gửi ý kiến góp ý
                                </button>
                            </div>
                        ) : (
                            <div className="p-4 bg-green-50 text-green-700 rounded-md border border-green-200">
                                ✅ Bạn đã thống nhất vào lúc 09:00 ngày 06/10/2025.
                            </div>
                        )}
                    </div>

                    {/* Comments Area (for admin/creator) */}
                    <div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-3">Các ý kiến đã góp ý</h3>
                        <div className="space-y-4">
                            {detail.comments.map(comment => (
                                <div key={comment.id} className="flex gap-3">
                                    <img src={comment.user.avatar} alt={comment.user.name} className="h-10 w-10 rounded-full" />
                                    <div className="flex-1 bg-gray-100 p-3 rounded-lg">
                                        <div className="flex justify-between items-center">
                                            <p className="font-semibold text-gray-900">{comment.user.name}</p>
                                            <p className="text-xs text-gray-500">{comment.time}</p>
                                        </div>
                                        <p className="mt-1 text-gray-700">{comment.content}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Column */}
                <div className="lg:col-span-1">
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <h3 className="text-xl font-semibold text-primaryRed border-b pb-2 mb-4">Danh sách tham gia</h3>
                        <ul className="space-y-3">
                            {detail.participants.map(p => (
                                <li key={p.id} className="flex items-center gap-3">
                                    <img src={p.avatar} alt={p.name} className="h-10 w-10 rounded-full" />
                                    <p className="flex-1 font-medium text-gray-800">{p.name}</p>
                                    {getStatusIcon(p.status)}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FeedbackRequestDetailPage;