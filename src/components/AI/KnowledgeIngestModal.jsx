import React, { useState } from 'react';
import apiClient from '../../api/client';

const KnowledgeIngestModal = ({ isOpen, onClose }) => {
    const [category, setCategory] = useState('');
    const [file, setFile] = useState(null);
    const [uploadData, setUploadData] = useState(null); // { tempFilePath, name }
    const [status, setStatus] = useState({ loading: false, error: null, success: null });

    const handleFileChange = async (e) => {
        const selectedFile = e.target.files[0];
        if (!selectedFile) return;

        setFile(selectedFile);
        setStatus({ loading: true, error: null, success: null });

        const formData = new FormData();
        formData.append('documents', selectedFile); // Sửa tên trường từ 'file' thành 'documents'

        try {
            const response = await apiClient.post('/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            // [SỬA LỖI] API trả về { files: [...] }. Chúng ta cần lấy đối tượng file đầu tiên.
            if (response.data && response.data.files && response.data.files.length > 0) {
                setUploadData(response.data.files[0]); // Lưu đối tượng file đầu tiên: { filePath, name }
            } else {
                throw new Error("API upload không trả về thông tin file hợp lệ.");
            }

            setStatus({ loading: false, error: null, success: 'Tải file lên thành công. Sẵn sàng để nạp.' });
        } catch (err) {
            setStatus({ loading: false, error: 'Tải file lên thất bại.', success: null });
            console.error(err);
        }
    };

    const handleIngest = async () => {
        if (!category || !uploadData) {
            setStatus({ ...status, error: 'Vui lòng điền danh mục và tải lên một file.' });
            return;
        }

        setStatus({ loading: true, error: null, success: null });
        try {
            await apiClient.post('/knowledge', {
                category: category,
                tempFilePath: uploadData.filePath, // [SỬA LỖI] Tên trường đúng là 'filePath'
            });
            setStatus({ loading: false, error: null, success: 'Nạp tri thức thành công!' });
            setTimeout(() => {
                onClose(); // Đóng modal sau khi thành công
            }, 1000);
        } catch (err) {
            setStatus({ loading: false, error: 'Nạp tri thức thất bại.', success: null });
            console.error(err);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
                <h2 className="text-2xl font-bold text-primaryRed mb-6">Nạp Tri thức mới</h2>
                <div className="space-y-4">
                    <div>
                        <label htmlFor="category" className="block text-sm font-medium text-gray-700">Tên danh mục</label>
                        <input type="text" id="category" value={category} onChange={(e) => setCategory(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primaryRed focus:border-primaryRed sm:text-sm" />
                    </div>
                    <div>
                        <label htmlFor="file-upload" className="block text-sm font-medium text-gray-700">Tệp tin (.txt)</label>
                        <input id="file-upload" type="file" accept=".txt" onChange={handleFileChange} className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-primaryRed hover:file:bg-red-100" />
                    </div>
                </div>
                {status.loading && <p className="mt-4 text-blue-600">Đang xử lý...</p>}
                {status.error && <p className="mt-4 text-red-600">{status.error}</p>}
                {status.success && <p className="mt-4 text-green-600">{status.success}</p>}
                <div className="mt-8 flex justify-end gap-4">
                    <button onClick={onClose} className="px-4 py-2 font-semibold text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300">Hủy</button>
                    <button
                        onClick={handleIngest}
                        disabled={!uploadData || status.loading}
                        className="px-4 py-2 font-semibold text-white bg-primaryRed rounded-md hover:bg-red-700 disabled:bg-gray-400"
                    >
                        {status.loading ? 'Đang lưu...' : 'Lưu'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default KnowledgeIngestModal;