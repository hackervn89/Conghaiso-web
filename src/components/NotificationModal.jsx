import React, { useState } from 'react';
import apiClient from '../api/client';

const NotificationModal = ({ isOpen, onClose, meetingId }) => {
    const [title, setTitle] = useState('');
    const [body, setBody] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!title || !body) {
            setError("Tiêu đề và nội dung không được để trống.");
            return;
        }
        setLoading(true);
        setError('');

        try {
            await apiClient.post(`/meetings/${meetingId}/notify`, { title, body });
            alert('Gửi thông báo thành công!');
            onClose(); // Đóng modal sau khi gửi
        } catch (err) {
            setError(err.response?.data?.message || 'Có lỗi xảy ra, không thể gửi thông báo.');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-lg">
                <h2 className="text-2xl font-bold text-primaryRed mb-6">Gửi Thông báo Tùy chỉnh</h2>
                {error && <p className="text-red-500 bg-red-100 p-3 rounded-md mb-4">{error}</p>}
                
                <form onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Tiêu đề*</label>
                            <input 
                                type="text" 
                                value={title} 
                                onChange={(e) => setTitle(e.target.value)} 
                                required 
                                className="w-full p-3 border rounded-md" 
                                placeholder="Ví dụ: Thay đổi địa điểm họp"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nội dung thông báo*</label>
                            <textarea 
                                value={body} 
                                onChange={(e) => setBody(e.target.value)} 
                                required 
                                className="w-full p-3 border rounded-md" 
                                rows="4"
                                placeholder="Nhập nội dung chi tiết..."
                            ></textarea>
                        </div>
                    </div>
                    <div className="flex justify-end gap-4 mt-8 pt-4 border-t">
                        <button type="button" onClick={onClose} className="px-6 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300">
                            Hủy
                        </button>
                        <button type="submit" disabled={loading} className="px-6 py-2 text-white bg-primaryRed rounded-md hover:bg-red-700 disabled:bg-red-300">
                            {loading ? 'Đang gửi...' : 'Gửi Thông báo'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default NotificationModal;
