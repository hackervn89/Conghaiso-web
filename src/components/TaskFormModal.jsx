import React, { useState, useEffect, useRef } from 'react';
import apiClient from '../api/client';
import { DocumentPlusIcon, TrashIcon, XMarkIcon, PaperClipIcon } from '@heroicons/react/24/outline';
import SearchableMultiSelect from './SearchableMultiSelect';
import SearchableSelect from './SearchableSelect';

const TaskFormModal = ({ isOpen, onClose, onSave, onDelete, taskData }) => {
    const isEditMode = !!taskData;

    // States for form fields
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [documentRef, setDocumentRef] = useState('');
    const [isDirect, setIsDirect] = useState(false);
    const [dueDate, setDueDate] = useState('');
    const [priority, setPriority] = useState('normal');
    
    // States for selections
    const [assignedOrgIds, setAssignedOrgIds] = useState([]);
    const [allOrganizations, setAllOrganizations] = useState([]);
    const [trackerIds, setTrackerIds] = useState([]);
    const [colleagues, setColleagues] = useState([]);
    const [documents, setDocuments] = useState([]);

    // Other states
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [loadingDetails, setLoadingDetails] = useState(false);
    const fileInputRef = useRef(null);

    useEffect(() => {
        if (isOpen) {
            // Tải danh sách người theo dõi và đơn vị
            apiClient.get('/users/colleagues') // Sửa: Gọi đúng API lấy đồng nghiệp
                .then(res => setColleagues(res.data.map(u => ({ value: u.user_id, label: u.full_name }))))
                .catch(() => setError("Không thể tải danh sách người theo dõi."));

            apiClient.get('/organizations').then(res => {
                const flattenOrgs = (orgs, level = 0) => {
                    let list = [];
                    orgs.forEach(org => {
                        list.push({ value: org.org_id, label: '\u00A0'.repeat(level * 4) + org.org_name });
                        if (org.children && org.children.length > 0) {
                            list = list.concat(flattenOrgs(org.children, level + 1));
                        }
                    });
                    return list;
                };
                setAllOrganizations(flattenOrgs(res.data));
            }).catch(() => setError("Không thể tải danh sách đơn vị."));

            if (isEditMode && taskData) {
                setLoadingDetails(true);
                apiClient.get(`/tasks/${taskData.task_id}`)
                    .then(res => {
                        const details = res.data;
                        setTitle(details.title || '');
                        setDescription(details.description || '');
                        setDocumentRef(details.document_ref || '');
                        setIsDirect(details.is_direct_assignment || false);
                        setDueDate(details.due_date ? details.due_date.split('T')[0] : '');
                        setPriority(details.priority || 'normal');
                        setAssignedOrgIds(details.assignedOrgIds || []);
                        setTrackerIds(details.trackerIds || []);
                        setDocuments(details.documents || []);
                    })
                    .catch(() => setError("Không thể tải chi tiết công việc."))
                    .finally(() => setLoadingDetails(false));
            } else {
                // Reset form
                setTitle('');
                setDescription('');
                setDocumentRef('');
                setIsDirect(false);
                setDueDate('');
                setPriority('normal');
                setAssignedOrgIds([]);
                setTrackerIds([]);
                setDocuments([]);
            }
             setError('');
        }
    }, [isOpen, isEditMode, taskData]);

    const handleFileSelectAndUpload = async (event) => {
        const files = event.target.files;
        if (!files || files.length === 0) return;
        
        const formData = new FormData();
        Array.from(files).forEach(file => {
            formData.append('documents', file);
        });

        try {
            const response = await apiClient.post('/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            const newDocs = response.data.files.map(file => ({
                doc_name: file.name,
                filePath: file.filePath,
            }));
            setDocuments(prevDocs => [...prevDocs, ...newDocs]);
        } catch (err) {
            setError("Tải file thất bại.");
        } finally {
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };
    
    const removeDocument = (docIdToRemove) => {
        setDocuments(documents.filter(doc => doc.doc_id !== docIdToRemove && doc.filePath !== docIdToRemove));
    };
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        // [CẬP NHẬT LOGIC] Chuẩn bị payload theo yêu cầu mới của backend khi sửa công việc
        // 1. Lọc ra các tệp cũ người dùng muốn giữ lại (những tệp có doc_id).
        // Backend cần đối tượng đầy đủ { doc_id, doc_name, file_path } để so sánh và giữ lại.
        const documentsToKeep = documents
            .filter(d => d.doc_id);

        // 2. Lọc ra đường dẫn của các tệp mới tải lên (những tệp chưa có doc_id)
        const newDocumentPaths = documents.filter(d => d.filePath && !d.doc_id).map(d => d.filePath);

        const payload = {
            title,
            description,
            document_ref: documentRef,
            is_direct_assignment: isDirect,
            due_date: dueDate || null,
            priority,
            assignedOrgIds,
            trackerIds,
            documents: documentsToKeep, // Mảng các tệp cũ cần giữ lại
            newDocumentPaths, // Mảng đường dẫn tạm của các tệp mới
        };

        console.log("[Frontend] Dữ liệu gửi đi để cập nhật công việc:", JSON.stringify(payload, null, 2));

        try {
            const response = isEditMode
                ? await apiClient.put(`/tasks/${taskData.task_id}`, payload)
                : await apiClient.post('/tasks', payload);
            onSave(response.data);
            onClose();
        } catch (err) {
            console.error("[Frontend] Lỗi khi lưu công việc:", err.response || err);
            setError(err.response?.data?.message || 'Có lỗi xảy ra, không thể lưu công việc.');
        } finally {
            setLoading(false);
        }
    };

    const handleCompleteTask = async () => {
        if (!isEditMode || !taskData.task_id) return;
        setLoading(true);
        try {
            const response = await apiClient.put(`/tasks/${taskData.task_id}/status`, { status: 'completed' });
            onSave(response.data);
            onClose();
        } catch (error) {
            alert(error.response?.data?.message || 'Không thể hoàn thành công việc.');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!isEditMode || !taskData.task_id) return;
        if (window.confirm('Bạn có chắc chắn muốn xóa công việc này không?')) {
            setLoading(true);
            try {
                await apiClient.delete(`/tasks/${taskData.task_id}`);
                alert('Đã xoá công việc thành công.');
                
                try {
                    onDelete(taskData.task_id);
                } catch (uiError) {
                    console.error('Lỗi khi cập nhật danh sách công việc sau khi xóa:', uiError);
                } finally {
                    onClose();
                }

            } catch (apiError) {
                console.error('Lỗi API khi xóa công việc:', apiError.response);
                alert(apiError.response?.data?.message || 'Không thể xóa công việc. Kiểm tra console để biết thêm chi tiết.');
            } finally {
                setLoading(false);
            }
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-5xl max-h-[95vh] flex flex-col">
                {/* Header */}
                <div className="flex justify-between items-center mb-6 flex-shrink-0">
                    <h2 className="text-2xl font-bold text-primaryRed">{isEditMode ? 'Chi tiết Công việc' : 'Giao Công Việc Mới'}</h2>
                    <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:bg-red-100 hover:text-primaryRed">
                        <XMarkIcon className="h-6 w-6" />
                    </button>
                </div>

                {error && <p className="text-red-600 bg-red-100 p-3 rounded-lg mb-4 flex-shrink-0 border border-red-200">{error}</p>}
                
                {loadingDetails ? (
                    <div className="flex-1 flex items-center justify-center">Đang tải chi tiết công việc...</div>
                ) : (
                    <form id="task-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto pr-4 -mr-4 grid grid-cols-1 md:grid-cols-5 gap-x-8">
                        <input type="file" ref={fileInputRef} onChange={handleFileSelectAndUpload} className="hidden" multiple />
                        
                        {/* Cột trái: Nội dung chính */}
                        <div className="md:col-span-3 space-y-5">
                            <div>
                                <label className="block text-sm font-semibold text-gray-800 mb-1">Tên công việc*</label>
                                <input type="text" value={title} onChange={e => setTitle(e.target.value)} required className="w-full p-2 border border-gray-300 rounded-md focus:ring-primaryRed focus:border-primaryRed" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-800 mb-1">Nội dung chi tiết</label>
                                <textarea value={description} onChange={e => setDescription(e.target.value)} rows="5" className="w-full p-2 border border-gray-300 rounded-md focus:ring-primaryRed focus:border-primaryRed" />
                            </div>
                             <div>
                                <label className="block text-sm font-semibold text-gray-800 mb-2">Tài liệu đính kèm</label>
                                <div className="border-2 border-dashed border-gray-300 p-4 rounded-lg space-y-2">
                                    {documents.length > 0 && (
                                        <div className="space-y-2">
                                            {documents.map((doc, index) => (
                                                <div key={doc.filePath || doc.doc_id || index} className="flex items-center justify-between bg-gray-100 p-2 rounded-md">
                                                    <div className="flex items-center min-w-0">
                                                        <PaperClipIcon className="h-5 w-5 text-gray-500 mr-2 flex-shrink-0" />
                                                        {doc.doc_id ? (
                                                            <a href={`${apiClient.defaults.baseURL}/files/view?path=${doc.file_path}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 truncate hover:underline text-sm">
                                                                {doc.doc_name}
                                                            </a>
                                                        ) : (
                                                            <span className="text-gray-800 truncate text-sm">{doc.doc_name}</span>
                                                        )}
                                                    </div>
                                                    <button type="button" onClick={() => removeDocument(doc.filePath || doc.doc_id)} className="text-red-500 hover:text-red-700 ml-2">
                                                        <TrashIcon className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    <button type="button" onClick={() => fileInputRef.current.click()} className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-primaryRed bg-red-50 rounded-md hover:bg-red-100 border border-transparent">
                                        <DocumentPlusIcon className="h-5 w-5" />
                                        Thêm tài liệu
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Cột phải: Cấu hình */}
                        <div className="md:col-span-2 space-y-5">
                             <div>
                                <label className="block text-sm font-semibold text-gray-800 mb-1">Đơn vị chủ trì (Thực hiện)*</label>
                                <SearchableMultiSelect
                                    options={allOrganizations}
                                    value={assignedOrgIds}
                                    onChange={setAssignedOrgIds}
                                    placeholder="Gõ để tìm và chọn đơn vị..."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-800 mb-1">Người theo dõi</label>
                                <SearchableMultiSelect 
                                    options={colleagues} 
                                    value={trackerIds} 
                                    onChange={setTrackerIds} 
                                    placeholder="Gõ để tìm và chọn người theo dõi..." />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-800 mb-1">Hạn hoàn thành</label>
                                    <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md focus:ring-primaryRed focus:border-primaryRed" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-800 mb-1">Mức độ ưu tiên</label>
                                    <select value={priority} onChange={e => setPriority(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md bg-white focus:ring-primaryRed focus:border-primaryRed">
                                        <option value="normal">Thông thường</option>
                                        <option value="important">Quan trọng</option>
                                        <option value="urgent">Khẩn</option>
                                    </select>
                                </div>
                            </div>
                            <div className="p-3 bg-gray-50 rounded-lg border">
                                <label className="block text-sm font-semibold text-gray-800 mb-1">Văn bản giao việc</label>
                                <input type="text" placeholder="Số/Ký hiệu" value={documentRef} onChange={e => setDocumentRef(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md focus:ring-primaryRed focus:border-primaryRed" />
                                <div className="mt-2 flex items-center">
                                    <input type="checkbox" id="isDirect" checked={isDirect} onChange={e => setIsDirect(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-primaryRed focus:ring-red-400" />
                                    <label htmlFor="isDirect" className="ml-2 text-sm text-gray-700">Giao trực tiếp (không qua văn bản)</label>
                                </div>
                            </div>
                        </div>
                    </form>
                )}

                {/* Footer */}
                <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200 flex-shrink-0">
                    {/* Nút bên trái: Xóa, Hoàn thành */}
                    <div className="flex gap-2">
                        {isEditMode && (
                            <>
                                {taskData?.status !== 'completed' && (
                                    <button 
                                        type="button" 
                                        disabled={loading || loadingDetails} 
                                        onClick={handleCompleteTask} 
                                        className="px-4 py-2 text-sm font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:bg-green-300 transition-colors"
                                    >
                                        Hoàn thành
                                    </button>
                                )}
                                <button 
                                    type="button" 
                                    disabled={loading || loadingDetails} 
                                    onClick={handleDelete} 
                                    className="px-4 py-2 text-sm font-semibold text-red-600 bg-white border border-red-300 rounded-lg hover:bg-red-50 disabled:opacity-50 transition-colors"
                                >
                                    Xóa
                                </button>
                            </>
                        )}
                    </div>
                    {/* Nút bên phải: Hủy, Lưu */}
                    <div className="flex gap-4">
                        <button 
                            type="button" 
                            onClick={onClose} 
                            className="px-6 py-2 font-semibold text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                            Hủy
                        </button>
                        <button 
                            type="submit" 
                            form="task-form" 
                            disabled={loading || loadingDetails} 
                            className="px-6 py-2 font-semibold text-white bg-primaryRed rounded-lg hover:bg-red-700 disabled:bg-red-300 transition-colors"
                        >
                            {loading ? 'Đang lưu...' : 'Lưu'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TaskFormModal;