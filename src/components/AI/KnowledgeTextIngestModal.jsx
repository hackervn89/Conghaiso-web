import React, { useState } from 'react';
import apiClient from '../../api/client';

const KnowledgeTextIngestModal = ({ isOpen, onClose }) => {
    const [sourceDocument, setSourceDocument] = useState('');
    const [category, setCategory] = useState('');
    const [textContent, setTextContent] = useState('');
    const [replaceExisting, setReplaceExisting] = useState(true);
    const [status, setStatus] = useState({ loading: false, error: null, success: null });

    const handleIngest = async () => {
        if (!sourceDocument.trim() || !textContent.trim()) {
            setStatus({ loading: false, error: 'Vui lòng điền Tên tài liệu gốc và Nội dung văn bản.', success: null });
            return;
        }

        setStatus({ loading: true, error: null, success: null });

        try {
            await apiClient.post('/knowledge/from-text', {
                source_document: sourceDocument.trim(),
                category: category.trim(),
                text: textContent,
                replaceExisting,
            });

            setStatus({ loading: false, error: null, success: 'Nạp tri thức từ văn bản thành công!' });
            setTimeout(() => {
                onClose();
            }, 1200);
        } catch (err) {
            const errorMessage = err.response?.data?.message || 'Nạp tri thức thất bại. Vui lòng thử lại.';
            setStatus({ loading: false, error: errorMessage, success: null });
            console.error(err);
        }
    };

    const handleClose = () => {
        setSourceDocument('');
        setCategory('');
        setTextContent('');
        setReplaceExisting(true);
        setStatus({ loading: false, error: null, success: null });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-2xl">
                <h2 className="text-2xl font-bold text-primaryRed mb-6">Nạp Tri thức từ Văn bản</h2>
                <div className="space-y-4">
                    <div>
                        <label htmlFor="source_document" className="block text-sm font-medium text-gray-700">Tên tài liệu gốc*</label>
                        <input type="text" id="source_document" value={sourceDocument} onChange={(e) => setSourceDocument(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primaryRed focus:border-primaryRed sm:text-sm" />
                    </div>
                    <div>
                        <label htmlFor="category" className="block text-sm font-medium text-gray-700">Danh mục (tùy chọn)</label>
                        <input type="text" id="category" value={category} onChange={(e) => setCategory(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primaryRed focus:border-primaryRed sm:text-sm" />
                    </div>
                    <div>
                        <label htmlFor="text_content" className="block text-sm font-medium text-gray-700">Nội dung văn bản*</label>
                        <textarea id="text_content" value={textContent} onChange={(e) => setTextContent(e.target.value)} rows="10" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primaryRed focus:border-primaryRed sm:text-sm" placeholder="Dán toàn bộ nội dung vào đây. Hệ thống sẽ tự động chia chunk thông minh."></textarea>
                    </div>
                    <div className="flex items-start gap-2">
                        <input
                            id="replace-existing-text"
                            type="checkbox"
                            checked={replaceExisting}
                            onChange={(e) => setReplaceExisting(e.target.checked)}
                            className="mt-1"
                        />
                        <label htmlFor="replace-existing-text" className="text-sm text-gray-700">
                            Ghi đè dữ liệu cũ của cùng tên tài liệu để tránh trùng lặp.
                        </label>
                    </div>
                </div>
                {status.loading && <p className="mt-4 text-blue-600">Đang xử lý...</p>}
                {status.error && <p className="mt-4 text-red-600">{status.error}</p>}
                {status.success && <p className="mt-4 text-green-600">{status.success}</p>}
                <div className="mt-8 flex justify-end gap-4">
                    <button onClick={handleClose} className="px-4 py-2 font-semibold text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300">Hủy</button>
                    <button
                        onClick={handleIngest}
                        disabled={status.loading}
                        className="px-4 py-2 font-semibold text-white bg-primaryRed rounded-md hover:bg-red-700 disabled:bg-gray-400"
                    >
                        {status.loading ? 'Đang lưu...' : 'Lưu và Nạp'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default KnowledgeTextIngestModal;
