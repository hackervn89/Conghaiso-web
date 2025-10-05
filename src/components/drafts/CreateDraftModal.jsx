import React, { useState, useRef } from 'react';
import apiClient from '../../api/client';
import UserSelectorWeb from '../UserSelectorWeb';

const CreateDraftModal = ({ isOpen, onClose, onDraftCreated }) => {
    const [title, setTitle] = useState('');
    const [documentNumber, setDocumentNumber] = useState('');
    const [deadline, setDeadline] = useState('');
    const [participants, setParticipants] = useState([]);
    const [documentFiles, setDocumentFiles] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const fileInputRef = useRef(null);

    const handleFileChange = async (event) => {
        const files = event.target.files;
        if (!files || files.length === 0) return;

        setDocumentFiles(prevFiles => [...prevFiles, ...Array.from(files)]);
    };

    const resetForm = () => {
        setTitle('');
        setDocumentNumber('');
        setDeadline('');
        setParticipants([]);
        setDocumentFiles([]);
        setError('');
        setIsLoading(false);
    };

    const removeDocument = (fileToRemove) => {
        setDocumentFiles(files => files.filter(file => file !== fileToRemove));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!title || participants.length === 0 || documentFiles.length === 0) {
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
        documentFiles.forEach(file => {
            formData.append('documents', file);
        });

        try {
            await apiClient.post('/drafts', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            resetForm();
            alert('Tạo luồng góp ý thành công!');
            onDraftCreated();
        } catch (err) {
            setError(err.response?.data?.message || 'Lỗi khi tạo dự thảo. Vui lòng kiểm tra lại thông tin.');
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
                <form id="create-draft-form" onSubmit={handleSubmit} className="space-y-4">
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
                        <input type="file" ref={fileInputRef} onChange={handleFileChange} multiple className="hidden" />
                        <div className="mt-1 p-2 border border-gray-300 rounded-md bg-gray-50 min-h-[60px]">
                            {documentFiles.map((doc, index) => (
                                <div key={index} className="flex items-center justify-between bg-white p-1 rounded-md mb-1 text-sm">
                                    <span className="text-blue-600 truncate">{doc.name}</span>
                                    <button 
                                        type="button" 
                                        onClick={() => removeDocument(doc)} 
                                        className="text-red-500 text-xs ml-2 font-semibold"
                                    >
                                        XÓA
                                    </button>
                                </div>
                            ))}
                            <button type="button" onClick={() => fileInputRef.current.click()} className="text-sm text-blue-600 hover:text-blue-800 w-full text-center py-1" disabled={isLoading}>
                                {isLoading ? 'Đang tải lên...' : '+ Bấm để chọn file'}
                            </button>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Người tham gia góp ý <span className="text-red-500">*</span></label>
                        <UserSelectorWeb selectedIds={participants} setSelectedIds={setParticipants} />
                    </div>
                </form>
                <div className="flex justify-end gap-3 pt-4 mt-4 border-t flex-shrink-0">
                    <button 
                        type="button" 
                        onClick={() => {
                            resetForm();
                            onClose();
                        }} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">
                        Hủy
                    </button>
                    <button type="submit" form="create-draft-form" disabled={isLoading} className="px-4 py-2 bg-primaryRed text-white rounded-md hover:bg-red-700 disabled:bg-red-300">
                        {isLoading ? 'Đang xử lý...' : 'Tạo Luồng'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CreateDraftModal;