import React, { useState, useEffect } from 'react';
import apiClient from '@/api/client';

const DelegationModal = ({ meetingId, onClose, onSuccess }) => {
    const [candidates, setCandidates] = useState([]);
    const [selectedUserId, setSelectedUserId] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchCandidates = async () => {
            try {
                // Gọi API mới để lấy danh sách ứng viên từ backend
                const response = await apiClient.get(`/meetings/${meetingId}/delegation-candidates`);
                if (response.data.length === 0) {
                    setError("Bạn không quản lý đơn vị nào hoặc đơn vị của bạn không có thành viên để ủy quyền.");
                }
                setCandidates(response.data);
            } catch (err) {
                setError('Không thể tải danh sách người có thể ủy quyền.');
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchCandidates();
    }, [meetingId]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedUserId) {
            setError('Vui lòng chọn một người để ủy quyền.');
            return;
        }
        setIsLoading(true);
        setError('');
        try {
            await apiClient.post(`/meetings/${meetingId}/attendees/me/delegate`, { delegateToUserId: selectedUserId });
            onSuccess(); // Gọi callback để tải lại dữ liệu trang chi tiết
        } catch (err) {
            setError('Đã xảy ra lỗi khi thực hiện ủy quyền.');
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
                <h2 className="text-xl font-bold mb-4">Ủy quyền tham dự cuộc họp</h2>
                {error && <p className="text-red-500 mb-4">{error}</p>}
                <form onSubmit={handleSubmit}>
                    <div className="mb-4 min-h-[80px]">
                        <label htmlFor="delegate-select" className="block text-sm font-medium text-gray-700 mb-1">
                            Chọn người tham dự thay:
                        </label>
                        {isLoading ? <p>Đang tải danh sách...</p> : (
                            <select
                            id="delegate-select"
                            value={selectedUserId}
                            onChange={(e) => setSelectedUserId(e.target.value)}
                            disabled={candidates.length === 0}
                            className="block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        >
                            <option value="">-- Chọn một người --</option>
                            {candidates.map(c => (
                                <option key={c.user_id} value={c.user_id}>
                                    {c.full_name} ({c.position})
                                </option>
                            ))}
                        </select>
                        )}
                    </div>
                    <div className="flex justify-end gap-3 mt-6">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">
                            Hủy
                        </button>
                        <button type="submit" disabled={isLoading} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300">
                            {isLoading ? 'Đang xử lý...' : 'Xác nhận'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default DelegationModal;