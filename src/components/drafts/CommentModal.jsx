import React, { useState } from 'react';
import apiClient from '../../api/client';

const CommentModal = ({ isOpen, onClose, draftId, onCommentSubmitted }) => {
    const [comment, setComment] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!comment.trim()) {
            setError('Nội dung góp ý không được để trống.');
            return;
        }
        setError('');
        setIsLoading(true);

        try {
            await apiClient.post(`/drafts/${draftId}/comment`, { comment });
            alert('Gửi góp ý thành công!');
            onCommentSubmitted();
        } catch (err) {
            setError(err.response?.data?.message || 'Lỗi khi gửi góp ý.');
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg">
                <h2 className="text-xl font-bold mb-4 text-primaryRed">Gửi Ý kiến Góp ý</h2>
                {error && <p className="text-red-500 mb-4">{error}</p>}
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label htmlFor="comment-textarea" className="block text-sm font-medium text-gray-700 mb-1">
                            Nội dung góp ý của bạn:
                        </label>
                        <textarea
                            id="comment-textarea"
                            rows="6"
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primaryRed focus:border-primaryRed"
                        ></textarea>
                    </div>
                    <div className="flex justify-end gap-3 mt-6">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Hủy</button>
                        <button type="submit" disabled={isLoading} className="px-4 py-2 bg-primaryRed text-white rounded-md hover:bg-red-700 disabled:bg-red-300">{isLoading ? 'Đang gửi...' : 'Gửi Góp ý'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CommentModal;