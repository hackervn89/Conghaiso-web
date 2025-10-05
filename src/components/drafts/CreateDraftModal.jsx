import React, { useState, useRef } from 'react';
import apiClient from '../../api/client';
import UserSelectorWeb from '../UserSelectorWeb';

const CreateDraftModal = ({ isOpen, onClose, onDraftCreated }) => {
    const [title, setTitle] = useState('');
    const [documentNumber, setDocumentNumber] = useState('');
    const [deadline, setDeadline] = useState('');
    const [participants, setParticipants] = useState([]);
    const [uploadedDocuments, setUploadedDocuments] = useState([]); // State mới để lưu file đã upload
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const fileInputRef = useRef(null);

    const handleFileChange = async (event) => {
        const files = event.target.files;
        if (!files || files.length === 0) return;

        const formData = new FormData();
        Array.from(files).forEach(file => {
            formData.append('documents', file);
        });

        setIsLoading(true);
        setError('');
        try {
            const response = await apiClient.post('/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            // Backend trả về { files: [...] }, mỗi file có { name, filePath }
            setUploadedDocuments(prevDocs => [...prevDocs, ...response.data.files]);
        } catch (err) {
            setError("Tải file thất bại. Vui lòng thử lại.");
        } finally {
            setIsLoading(false);
            if (fileInputRef.current) fileInputRef.current.value = ""; // Reset input để có thể chọn lại cùng file
        }
    };

    const resetForm = () => {
        setTitle('');
        setDocumentNumber('');
        setDeadline('');
        setParticipants([]);
        setUploadedDocuments([]);
        setError('');
        setIsLoading(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!title || participants.length === 0 || uploadedDocuments.length === 0) {
            setError('Tiêu đề, người tham gia và tài liệu là bắt buộc.');
            return;
        }
        setError('');
        setIsLoading(true);

        const formData = new FormData();
        formData.append('title', title);
        formData.append('document_number', documentNumber);
        formData.append('participants', JSON.stringify(participants));
        if (deadline) {
            formData.append('deadline', new Date(deadline).toISOString());
        }
        for (const file of documentFiles) { // Thay đổi: Lặp qua mảng và append từng file
            formData.append('documents', file); // Thay đổi: Tên trường là "documents" (số nhiều)
        }

        try {
            await apiClient.post('/drafts', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            resetForm();
            alert('Tạo luồng góp ý thành công!');
            onDraftCreated();
        } catch (err) {
            setError(err.response?.data?.message || 'Lỗi khi tạo dự thảo.');
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
            onClick={() => {
                resetForm();
                onClose();
            }}
        >
            <div 
                className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl"
                onClick={(e) => e.stopPropagation()} // Ngăn việc click bên trong modal làm đóng modal
            >
                <h2 className="text-xl font-bold mb-4 text-primaryRed">Tạo Luồng Góp Ý Mới</h2>
                {error && <p className="text-red-500 mb-4">{error}</p>}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Tiêu đề <span className="text-red-500">*</span></label>
                        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primaryRed focus:border-primaryRed" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Số hiệu văn bản</label>
                        <input type="text" value={documentNumber} onChange={(e) => setDocumentNumber(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primaryRed focus:border-primaryRed" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Hạn chót góp ý</label>
                        <input type="datetime-local" value={deadline} onChange={(e) => setDeadline(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primaryRed focus:border-primaryRed" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Tài liệu đính kèm <span className="text-red-500">*</span></label>
                        <input type="file" onChange={handleFileChange} required multiple className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-primaryRed hover:file:bg-red-100" />
                        {documentFiles.length > 0 && (
                            <div className="mt-2 text-xs text-gray-600">Đã chọn {documentFiles.length} tệp.</div>
                        )}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Người tham gia góp ý <span className="text-red-500">*</span></label>
                        <UserSelectorWeb selectedIds={participants} setSelectedIds={setParticipants} />
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <button 
                            type="button" 
                            onClick={() => {
                                resetForm();
                                onClose();
                            }} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">
                            Hủy
                        </button>
                        <button type="submit" disabled={isLoading} className="px-4 py-2 bg-primaryRed text-white rounded-md hover:bg-red-700 disabled:bg-red-300">
                            {isLoading ? 'Đang tạo...' : 'Tạo Luồng'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateDraftModal;