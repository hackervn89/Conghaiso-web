import React, { useState, useEffect, useRef } from 'react';
import apiClient from '../api/client';
import OrgCheckboxTree from './OrgCheckboxTree';
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
    const [assignedOrgIds, setAssignedOrgIds] = useState(new Set());
    const [trackerIds, setTrackerIds] = useState([]);
    const [colleagues, setColleagues] = useState([]);
    const [documents, setDocuments] = useState([]);

    // Other states
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [loadingDetails, setLoadingDetails] = useState(false); // State loading chi tiết
    const fileInputRef = useRef(null);


    useEffect(() => {
        if (isOpen) {
            // Luôn tải danh sách đồng nghiệp khi mở modal
            apiClient.get('/users/colleagues')
                .then(res => setColleagues(res.data.map(u => ({ value: u.user_id, label: u.full_name }))))
                .catch(() => setError("Không thể tải danh sách người theo dõi."));

            if (isEditMode && taskData) {
                // SỬA LỖI: Tải dữ liệu chi tiết từ API thay vì dùng dữ liệu tóm tắt
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
                        setAssignedOrgIds(new Set(details.assignedOrgIds || []));
                        setTrackerIds(details.trackerIds || []);
                        setDocuments(details.documents || []);
                    })
                    .catch(() => setError("Không thể tải chi tiết công việc."))
                    .finally(() => setLoadingDetails(false));
            } else {
                // Reset form cho công việc mới
                setTitle('');
                setDescription('');
                setDocumentRef('');
                setIsDirect(false);
                setDueDate('');
                setPriority('normal');
                setAssignedOrgIds(new Set());
                setTrackerIds([]);
                setDocuments([]);
            }
             setError('');
        }
    }, [isOpen, isEditMode, taskData]);

    const handleOrgSelectionChange = (orgId) => {
        const newSelection = new Set(assignedOrgIds);
        if (newSelection.has(orgId)) {
            newSelection.delete(orgId);
        } else {
            newSelection.add(orgId);
        }
        setAssignedOrgIds(newSelection);
    };

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
                google_drive_file_id: file.id,
            }));
            setDocuments(prevDocs => [...prevDocs, ...newDocs]);
        } catch (err) {
            setError("Tải file thất bại.");
        } finally {
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };
    
    const removeDocument = (docIdToRemove) => {
        setDocuments(documents.filter(doc => doc.doc_id !== docIdToRemove && doc.google_drive_file_id !== docIdToRemove));
    };
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const payload = {
            title,
            description,
            document_ref: documentRef,
            is_direct_assignment: isDirect,
            due_date: dueDate || null,
            priority,
            assignedOrgIds: Array.from(assignedOrgIds),
            trackerIds,
            documents,
        };

        try {
            const response = isEditMode
                ? await apiClient.put(`/tasks/${taskData.task_id}`, payload)
                : await apiClient.post('/tasks', payload);
            onSave(response.data);
            onClose();
        } catch (err) {
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
                // API call was successful.
                alert('Đã xoá công việc thành công.');
                
                // Now handle UI updates.
                try {
                    onDelete(taskData.task_id);
                } catch (uiError) {
                    console.error('Lỗi khi cập nhật danh sách công việc sau khi xóa:', uiError);
                } finally {
                    // Always close the modal after a successful deletion.
                    onClose();
                }

            } catch (apiError) {
                // This catch is for the API call
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
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-4xl max-h-[95vh] flex flex-col">
                <h2 className="text-2xl font-bold text-primaryRed mb-4 flex-shrink-0">{isEditMode ? 'Chi tiết Công việc' : 'Tạo Công việc Mới'}</h2>
                {error && <p className="text-red-500 bg-red-100 p-3 rounded-md mb-4 flex-shrink-0">{error}</p>}
                
                {loadingDetails ? (
                    <div className="flex-1 flex items-center justify-center">Đang tải chi tiết công việc...</div>
                ) : (
                    <form id="task-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto pr-2 space-y-4">
                        <input type="file" ref={fileInputRef} onChange={handleFileSelectAndUpload} className="hidden" multiple />
                        {/* Form fields */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Tên công việc*</label>
                            <input type="text" value={title} onChange={e => setTitle(e.target.value)} required className="w-full p-2 border rounded-md" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nội dung chi tiết</label>
                            <textarea value={description} onChange={e => setDescription(e.target.value)} rows="4" className="w-full p-2 border rounded-md" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Văn bản giao việc</label>
                                <input type="text" placeholder="Số/Ký hiệu" value={documentRef} onChange={e => setDocumentRef(e.target.value)} className="w-full p-2 border rounded-md" />
                                <div className="mt-2">
                                    <input type="checkbox" id="isDirect" checked={isDirect} onChange={e => setIsDirect(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-primaryRed focus:ring-red-400" />
                                    <label htmlFor="isDirect" className="ml-2 text-sm text-gray-700">Giao trực tiếp (không qua văn bản)</label>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Hạn hoàn thành</label>
                                <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="w-full p-2 border rounded-md" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Mức độ ưu tiên</label>
                                <select value={priority} onChange={e => setPriority(e.target.value)} className="w-full p-2 border rounded-md bg-white">
                                    <option value="normal">Thông thường</option>
                                    <option value="important">Quan trọng</option>
                                    <option value="urgent">Khẩn</option>
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Đơn vị chủ trì (Thực hiện)*</label>
                            <OrgCheckboxTree selectedIds={assignedOrgIds} onSelectionChange={handleOrgSelectionChange} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Người theo dõi</label>
                            <SearchableSelect options={colleagues} value={trackerIds[0]} onChange={val => setTrackerIds(val ? [val] : [])} placeholder="Chọn một người theo dõi..." />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Tài liệu đính kèm</label>
                            <div className="border p-2 rounded-md bg-gray-50 min-h-[50px]">
                                {documents.map((doc, index) => (
                                    <div key={doc.google_drive_file_id || index} className="flex items-center justify-between bg-white p-1 rounded-md mb-1">
                                        <span className="text-blue-600 truncate">{doc.doc_name}</span>
                                        <button type="button" onClick={() => removeDocument(doc.google_drive_file_id || doc.doc_name)} className="text-red-500 text-xs ml-2">XÓA</button>
                                    </div>
                                ))}
                                <button type="button" onClick={() => fileInputRef.current.click()} className="text-sm text-blue-600 hover:text-blue-800">+ Thêm tài liệu</button>
                            </div>
                        </div>
                    </form>
                )}


                <div className="flex justify-between items-center mt-6 pt-4 border-t flex-shrink-0">
                    <div className="flex gap-2">
                        {isEditMode && taskData?.status !== 'completed' && (
                             <button type="button" disabled={loading || loadingDetails} onClick={handleCompleteTask} className="px-4 py-2 text-white bg-green-600 rounded-md hover:bg-green-700 disabled:bg-green-300">Hoàn thành</button>
                        )}
                        {isEditMode && (
                            <button type="button" disabled={loading || loadingDetails} onClick={handleDelete} className="px-4 py-2 text-white bg-red-600 rounded-md hover:bg-red-700 disabled:bg-red-300">Xóa</button>
                        )}
                    </div>
                    <div className="flex gap-4">
                        <button type="button" onClick={onClose} className="px-6 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300">Hủy</button>
                        <button type="submit" form="task-form" disabled={loading || loadingDetails} className="px-6 py-2 text-white bg-primaryRed rounded-md hover:bg-red-700 disabled:bg-red-300">
                            {loading ? 'Đang lưu...' : 'Lưu'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TaskFormModal;

