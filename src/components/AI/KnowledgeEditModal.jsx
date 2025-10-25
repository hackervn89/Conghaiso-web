import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '../../api/client';

const KnowledgeEditModal = ({ isOpen, onClose, knowledgeId }) => {
    const [formData, setFormData] = useState({ category: '', source_document: '', content: '' });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

    const fetchKnowledgeDetail = useCallback(async () => {
        if (!knowledgeId) return;
        setLoading(true);
        try {
            const response = await apiClient.get(`/knowledge/${knowledgeId}`);
            setFormData({
                category: response.data.category || '',
                source_document: response.data.source_document || '',
                content: response.data.content || '',
            });
            setError(null);
        } catch (err) {
            setError('Không thể tải dữ liệu.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [knowledgeId]);

    useEffect(() => {
        if (isOpen) {
            fetchKnowledgeDetail();
        }
    }, [isOpen, fetchKnowledgeDetail]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async () => {
        setSaving(true);
        setError(null);
        try {
            await apiClient.put(`/knowledge/${knowledgeId}`, formData);
            onClose(); // Đóng và kích hoạt tải lại dữ liệu ở trang cha
        } catch (err) {
            setError('Lưu thất bại. Vui lòng thử lại.');
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-2xl">
                <h2 className="text-2xl font-bold text-primaryRed mb-6">Sửa Mẩu Tri thức</h2>
                {loading ? <p>Đang tải...</p> : error ? <p className="text-red-500">{error}</p> : (
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="category" className="block text-sm font-medium text-gray-700">Danh mục</label>
                            <input type="text" name="category" id="category" value={formData.category} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primaryRed focus:border-primaryRed sm:text-sm" />
                        </div>
                        <div>
                            <label htmlFor="source_document" className="block text-sm font-medium text-gray-700">Nguồn</label>
                            <input type="text" name="source_document" id="source_document" value={formData.source_document} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primaryRed focus:border-primaryRed sm:text-sm" />
                        </div>
                        <div>
                            <label htmlFor="content" className="block text-sm font-medium text-gray-700">Nội dung</label>
                            <textarea name="content" id="content" rows="10" value={formData.content} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primaryRed focus:border-primaryRed sm:text-sm"></textarea>
                        </div>
                    </div>
                )}
                {error && <p className="mt-4 text-red-500">{error}</p>}
                <div className="mt-8 flex justify-end gap-4">
                    <button onClick={onClose} className="px-4 py-2 font-semibold text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300">Hủy</button>
                    <button
                        onClick={handleSave}
                        disabled={loading || saving}
                        className="px-4 py-2 font-semibold text-white bg-primaryRed rounded-md hover:bg-red-700 disabled:bg-gray-400"
                    >
                        {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default KnowledgeEditModal;