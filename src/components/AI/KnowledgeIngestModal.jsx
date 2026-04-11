import React, { useState } from 'react';
import apiClient from '../../api/client';

const KnowledgeIngestModal = ({ isOpen, onClose }) => {
    const [category, setCategory] = useState('');
    const [file, setFile] = useState(null);
    const [replaceExisting, setReplaceExisting] = useState(true);
    const [status, setStatus] = useState({ loading: false, error: null, success: null, result: null });

    const handleSubmit = async () => {
        if (!file) {
            setStatus({ loading: false, error: 'Vui lòng chọn tệp cần nạp.', success: null, result: null });
            return;
        }

        setStatus({ loading: true, error: null, success: null, result: null });

        try {
            const formData = new FormData();
            formData.append('document', file);
            if (category.trim()) formData.append('category', category.trim());
            formData.append('replaceExisting', String(replaceExisting));

            const response = await apiClient.post('/knowledge/ingest-file', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            const result = response.data || {};
            setStatus({
                loading: false,
                error: null,
                success: result.message || 'Nạp tri thức thành công!',
                result,
            });

            setTimeout(() => {
                onClose();
            }, 1200);
        } catch (err) {
            const errorMessage = err.response?.data?.message || 'Nạp tri thức thất bại. Vui lòng thử lại.';
            setStatus({ loading: false, error: errorMessage, success: null, result: null });
            console.error(err);
        }
    };

    const handleClose = () => {
        setCategory('');
        setFile(null);
        setReplaceExisting(true);
        setStatus({ loading: false, error: null, success: null, result: null });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-xl">
                <h2 className="text-2xl font-bold text-primaryRed mb-6">Nạp Tri thức từ File</h2>

                <div className="space-y-4">
                    <div>
                        <label htmlFor="category" className="block text-sm font-medium text-gray-700">Danh mục (tùy chọn)</label>
                        <input
                            type="text"
                            id="category"
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            placeholder="Ví dụ: Công văn, Kế hoạch, Nghị quyết"
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primaryRed focus:border-primaryRed sm:text-sm"
                        />
                    </div>

                    <div>
                        <label htmlFor="file-upload" className="block text-sm font-medium text-gray-700">Tệp văn bản</label>
                        <input
                            id="file-upload"
                            type="file"
                            accept=".pdf,.docx,.txt"
                            onChange={(e) => setFile(e.target.files?.[0] || null)}
                            className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-primaryRed hover:file:bg-red-100"
                        />
                        <p className="mt-2 text-xs text-gray-500">Hỗ trợ định dạng: PDF, DOCX, TXT.</p>
                    </div>

                    <div className="flex items-start gap-2">
                        <input
                            id="replace-existing"
                            type="checkbox"
                            checked={replaceExisting}
                            onChange={(e) => setReplaceExisting(e.target.checked)}
                            className="mt-1"
                        />
                        <label htmlFor="replace-existing" className="text-sm text-gray-700">
                            Ghi đè dữ liệu cũ của cùng tên văn bản (khuyên dùng để tránh trùng chunk).
                        </label>
                    </div>
                </div>

                {status.loading && <p className="mt-4 text-blue-600">Đang xử lý nạp tri thức...</p>}
                {status.error && <p className="mt-4 text-red-600">{status.error}</p>}
                {status.success && (
                    <div className="mt-4 text-green-700 bg-green-50 border border-green-200 rounded-md p-3 text-sm">
                        <p className="font-semibold">{status.success}</p>
                        {status.result?.chunk_count != null && (
                            <p className="mt-1">Số chunk tạo ra: <b>{status.result.chunk_count}</b> | Đã nạp: <b>{status.result.ingested_count}</b></p>
                        )}
                    </div>
                )}

                <div className="mt-8 flex justify-end gap-4">
                    <button onClick={handleClose} className="px-4 py-2 font-semibold text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300">Hủy</button>
                    <button
                        onClick={handleSubmit}
                        disabled={!file || status.loading}
                        className="px-4 py-2 font-semibold text-white bg-primaryRed rounded-md hover:bg-red-700 disabled:bg-gray-400"
                    >
                        {status.loading ? 'Đang nạp...' : 'Nạp tri thức'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default KnowledgeIngestModal;
