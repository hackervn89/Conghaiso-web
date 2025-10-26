import React, { useState, useEffect } from 'react';
import apiClient from '../../api/client';

const AnchorKeywordFormModal = ({ isOpen, onClose, onSave, initialData }) => {
    const isEditMode = !!initialData;
    const [keyword, setKeyword] = useState('');
    const [type, setType] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (isEditMode && initialData) {
            setKeyword(initialData.keyword || '');
            setType(initialData.type || '');
        } else {
            // Reset form for creating new
            setKeyword('');
            setType('');
        }
        setError(null); // Reset error on open
    }, [isOpen, initialData, isEditMode]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!keyword) {
            setError('Từ khóa không được để trống.');
            return;
        }

        setLoading(true);
        setError(null);

        const payload = { keyword, type };

        try {
            if (isEditMode) {
                await apiClient.put(`/anchor-keywords/${initialData.id}`, payload);
            } else {
                await apiClient.post('/anchor-keywords', payload);
            }
            onSave(); // Trigger refresh on parent
        } catch (err) {
            setError(err.response?.data?.message || 'Đã có lỗi xảy ra. Vui lòng thử lại.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
                <h2 className="text-2xl font-bold text-primaryRed mb-6">
                    {isEditMode ? 'Sửa Từ khóa Neo' : 'Thêm Từ khóa Neo mới'}
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="keyword" className="block text-sm font-medium text-gray-700">Từ khóa *</label>
                        <input type="text" id="keyword" value={keyword} onChange={(e) => setKeyword(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primaryRed focus:border-primaryRed sm:text-sm" />
                    </div>
                    <div>
                        <label htmlFor="type" className="block text-sm font-medium text-gray-700">Loại (tùy chọn)</label>
                        <input type="text" id="type" value={type} onChange={(e) => setType(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primaryRed focus:border-primaryRed sm:text-sm" />
                    </div>

                    {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

                    <div className="mt-8 flex justify-end gap-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 font-semibold text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300">
                            Hủy
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 font-semibold text-white bg-primaryRed rounded-md hover:bg-red-700 disabled:bg-gray-400"
                        >
                            {loading ? 'Đang lưu...' : 'Lưu'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AnchorKeywordFormModal;