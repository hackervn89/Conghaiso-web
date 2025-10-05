import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Pagination from '../components/Pagination';
import CreateFeedbackRequestModal from '../components/CreateFeedbackRequestModal';
import { DocumentPlusIcon } from '@heroicons/react/24/outline';

// Mock data for UI development
const mockRequests = [
    { id: 1, title: 'Dự thảo Nghị định về quản lý ABC', creator: 'Nguyễn Văn A', deadline: '2025-10-20', user_status: 'cho_y_kien' },
    { id: 2, title: 'Dự thảo Thông tư hướng dẫn XYZ', creator: 'Trần Thị B', deadline: '2025-10-15', user_status: 'da_thong_nhat' },
    { id: 3, title: 'Kế hoạch triển khai công nghệ mới', creator: 'Lê Văn C', deadline: '2025-09-30', user_status: 'da_gop_y' },
    { id: 4, title: 'Quy chế làm việc của phòng ban', creator: 'Phạm Thị D', deadline: '2024-01-10', user_status: 'cho_y_kien' },
];

const getStatusBadge = (status) => {
    switch (status) {
        case 'cho_y_kien':
            return <span className="px-2 py-1 text-xs font-semibold text-white bg-yellow-500 rounded-full">Chờ ý kiến</span>;
        case 'da_thong_nhat':
            return <span className="px-2 py-1 text-xs font-semibold text-white bg-green-500 rounded-full">Đã thống nhất</span>;
        case 'da_gop_y':
            return <span className="px-2 py-1 text-xs font-semibold text-white bg-blue-500 rounded-full">Đã góp ý</span>;
        default:
            return null;
    }
};

const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN');
};

const isOverdue = (dateString) => {
    return new Date(dateString) < new Date();
};

const FeedbackRequestListPage = () => {
    const [requests, setRequests] = useState(mockRequests);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const totalPages = 5; // Mock total pages

    const handleRequestCreated = (newRequest) => {
        // In a real app, you would refetch the list or add the new request to the state
        console.log('New request created:', newRequest);
        setIsModalOpen(false);
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-primaryRed">Danh sách Góp ý Dự thảo</h1>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="px-4 py-2 font-bold text-white bg-primaryRed rounded-md hover:bg-red-700 flex items-center gap-2"
                >
                    <DocumentPlusIcon className="h-5 w-5" />
                    Tạo góp ý mới
                </button>
            </div>

            <div className="bg-white shadow-md rounded-lg overflow-hidden">
                <table className="min-w-full leading-normal">
                    <thead>
                        <tr className="bg-primaryRed text-left text-white uppercase text-sm">
                            <th className="px-5 py-3 border-b-2 border-red-700">Tên dự thảo</th>
                            <th className="px-5 py-3 border-b-2 border-red-700">Người tạo</th>
                            <th className="px-5 py-3 border-b-2 border-red-700">Hạn chót</th>
                            <th className="px-5 py-3 border-b-2 border-red-700">Trạng thái của bạn</th>
                            <th className="px-5 py-3 border-b-2 border-red-700">Hành động</th>
                        </tr>
                    </thead>
                    <tbody>
                        {requests.map((req) => (
                            <tr key={req.id} className="hover:bg-gray-100">
                                <td className="px-5 py-4 border-b border-gray-200 text-sm">
                                    <Link to={`/gop-y-du-thao/${req.id}`} className="font-semibold text-primaryRed hover:underline">
                                        {req.title}
                                    </Link>
                                </td>
                                <td className="px-5 py-4 border-b border-gray-200 text-sm">{req.creator}</td>
                                <td className={`px-5 py-4 border-b border-gray-200 text-sm ${isOverdue(req.deadline) ? 'text-red-600 font-semibold' : ''}`}>
                                    {formatDate(req.deadline)}
                                </td>
                                <td className="px-5 py-4 border-b border-gray-200 text-sm">
                                    {getStatusBadge(req.user_status)}
                                </td>
                                <td className="px-5 py-4 border-b border-gray-200 text-sm">
                                    <Link to={`/gop-y-du-thao/${req.id}`} className="text-blue-600 hover:text-blue-800 font-medium">
                                        Xem chi tiết
                                    </Link>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />

            <CreateFeedbackRequestModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleRequestCreated}
            />
        </div>
    );
};

export default FeedbackRequestListPage;