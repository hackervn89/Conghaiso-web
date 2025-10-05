import React, { useState } from 'react';
import UserSelectorWeb from './UserSelectorWeb';

const CreateFeedbackRequestModal = ({ isOpen, onClose, onSave }) => {
    const [title, setTitle] = useState('');
    const [documentNumber, setDocumentNumber] = useState('');
    const [deadline, setDeadline] = useState('');
    const [attendeeIds, setAttendeeIds] = useState([]);
    const [files, setFiles] = useState([]);
    const [error, setError] = useState('');

    const handleFileChange = (e) => {
        // Basic file handling, can be improved with progress bar
        setFiles(Array.from(e.target.files));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!title || !deadline || attendeeIds.length === 0) {
            setError('Vui lòng điền đầy đủ các trường bắt buộc: Tên dự thảo, Hạn chót và Người tham gia.');
            return;
        }
        // In a real app, you would handle file uploads here
        const newRequest = { title, documentNumber, deadline, attendeeIds, files };
        onSave(newRequest);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
                <h2 className="text-2xl font-bold text-primaryRed mb-6">Tạo Góp ý mới</h2>
                {error && <p className="text-red-500 bg-red-100 p-3 rounded-md mb-4">{error}</p>}

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto pr-4 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tên dự thảo văn bản*</label>
                        <input type="text" value={title} onChange={e => setTitle(e.target.value)} required className="w-full p-3 border rounded-md" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Số hiệu công văn</label>
                        <input type="text" value={documentNumber} onChange={e => setDocumentNumber(e.target.value)} className="w-full p-3 border rounded-md" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tải lên tài liệu</label>
                        <input type="file" onChange={handleFileChange} multiple className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-primaryRed hover:file:bg-red-100"/>
                        <div className="mt-2 text-xs text-gray-600">
                            {files.map(file => <p key={file.name}>{file.name}</p>)}
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Hạn chót góp ý*</label>
                        <input type="datetime-local" value={deadline} onChange={e => setDeadline(e.target.value)} required className="w-full p-3 border rounded-md" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Danh sách người tham gia*</label>
                        <UserSelectorWeb selectedIds={attendeeIds} setSelectedIds={setAttendeeIds} />
                    </div>
                </form>

                <div className="flex justify-end gap-4 mt-8 pt-4 border-t">
                    <button type="button" onClick={onClose} className="px-6 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300">
                        Hủy
                    </button>
                    <button type="submit" onClick={handleSubmit} className="px-6 py-2 text-white bg-primaryRed rounded-md hover:bg-red-700">
                        Tạo mới
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CreateFeedbackRequestModal;