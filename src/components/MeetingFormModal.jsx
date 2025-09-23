import React, { useState, useEffect, useRef } from 'react';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';
import UserSelectorWeb from './UserSelectorWeb';
import SearchableSelect from './SearchableSelect';
import TimePicker from './TimePicker'; // Import TimePicker

const splitISOString = (isoString) => {
    if (!isoString) return ['', ''];
    const date = new Date(isoString);
    date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
    const [datePart, timePart] = date.toISOString().split('T');
    return [datePart, timePart.slice(0, 5)];
};

const MeetingFormModal = ({ isOpen, onClose, onSave, initialData }) => {
    const { user } = useAuth();
    const isEditMode = !!initialData;

    const [title, setTitle] = useState('');
    const [location, setLocation] = useState('');
    const [startDate, setStartDate] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endDate, setEndDate] = useState('');
    const [endTime, setEndTime] = useState('');
    const [selectedOrgId, setSelectedOrgId] = useState('');
    const [organizations, setOrganizations] = useState([]);
    const [attendeeIds, setAttendeeIds] = useState([]);
    const [agenda, setAgenda] = useState([{ title: '', documents: [] }]);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    
    const [chairpersonId, setChairpersonId] = useState(null);
    const [secretaryId, setSecretaryId] = useState(null);
    
    const [allUsers, setAllUsers] = useState([]);
    const fileInputRef = useRef(null);
    const [currentAgendaIndex, setCurrentAgendaIndex] = useState(null);

    useEffect(() => {
        if (isOpen) {
            // Tải danh sách tất cả người dùng để lọc
            apiClient.get('/users').then(res => {
                setAllUsers(res.data.users);
            });

            if (isEditMode && initialData) {
                setTitle(initialData.title || '');
                setLocation(initialData.location || '');
                const [sDate, sTime] = splitISOString(initialData.start_time);
                setStartDate(sDate); setStartTime(sTime);
                const [eDate, eTime] = splitISOString(initialData.end_time);
                setEndDate(eDate); setEndTime(eTime);
                setSelectedOrgId(initialData.org_id || '');
                setChairpersonId(initialData.chairperson_id || null);
                setSecretaryId(initialData.meeting_secretary_id || null);

                const fetchDetails = async () => {
                    const response = await apiClient.get(`/meetings/${initialData.meeting_id}`);
                    setAttendeeIds(response.data.attendees.map(a => a.user_id).filter(id => id !== null));
                    setAgenda(response.data.agenda.length > 0 ? response.data.agenda : [{ title: '', documents: [] }]);
                }
                fetchDetails();
            } else {
                 setTitle(''); setLocation('');
                 setStartDate(''); setStartTime('');
                 setEndDate(''); setEndTime('');
                 setSelectedOrgId(''); setAttendeeIds([]);
                 setChairpersonId(null); setSecretaryId(null);
                 setAgenda([{ title: '', documents: [] }]);
            }
            if (user?.role === 'Admin') {
                apiClient.get('/organizations').then(res => setOrganizations(res.data));
            }
        }
    }, [initialData, isEditMode, isOpen, user]);

    // ... (Các hàm xử lý upload và agenda giữ nguyên)
    const handleFileSelectAndUpload = async (event) => {
        const files = event.target.files;
        if (!files || files.length === 0 || currentAgendaIndex === null) return;
        const filesToUpload = Array.from(files);
        let tempAgenda = [...agenda];
        filesToUpload.forEach(file => {
            tempAgenda[currentAgendaIndex].documents.push({ doc_name: file.name, google_drive_file_id: null, isUploading: true });
        });
        setAgenda(tempAgenda);
        const formData = new FormData();
        filesToUpload.forEach(file => { formData.append('documents', file); });
        try {
            const response = await apiClient.post('/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            let finalAgenda = [...agenda];
            response.data.files.forEach(uploadedFile => {
                const docIndex = finalAgenda[currentAgendaIndex].documents.findIndex(d => d.isUploading && d.doc_name === uploadedFile.name);
                if(docIndex !== -1){
                    finalAgenda[currentAgendaIndex].documents[docIndex].google_drive_file_id = uploadedFile.id;
                    finalAgenda[currentAgendaIndex].documents[docIndex].isUploading = false;
                }
            });
            setAgenda(finalAgenda);
        } catch (err) {
            setError("Tải file thất bại.");
            let cleanedAgenda = [...agenda];
            cleanedAgenda[currentAgendaIndex].documents = cleanedAgenda[currentAgendaIndex].documents.filter(doc => !doc.isUploading);
            setAgenda(cleanedAgenda);
        } finally {
            if(fileInputRef.current) fileInputRef.current.value = "";
            setCurrentAgendaIndex(null);
        }
    };
    const triggerFileInput = (agendaIndex) => {
        setCurrentAgendaIndex(agendaIndex);
        fileInputRef.current.click();
    };
    const handleAgendaChange = (index, value) => {
        const newAgenda = [...agenda];
        newAgenda[index].title = value;
        setAgenda(newAgenda);
    };
    const addAgendaItem = () => setAgenda([...agenda, { title: '', documents: [] }]);
    const removeAgendaItem = (index) => {
        const newAgenda = [...agenda];
        newAgenda.splice(index, 1);
        setAgenda(newAgenda);
    };
    const removeDocument = (agendaIndex, docIndex) => {
        const newAgenda = [...agenda];
        newAgenda[agendaIndex].documents.splice(docIndex, 1);
        setAgenda(newAgenda);
    };


    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        const finalOrgId = user?.role === 'Admin' ? selectedOrgId : (user?.managedScopes ? user.managedScopes[0] : null);
        try {
            const startDateTime = new Date(`${startDate}T${startTime}`).toISOString();
            const endDateTime = (endDate && endTime) ? new Date(`${endDate}T${endTime}`).toISOString() : null;
            const payload = {
                title, location, 
                startTime: startDateTime,
                endTime: endDateTime,
                orgId: finalOrgId,
                attendeeIds,
                agenda: agenda.filter(item => item.title.trim() !== ''),
                chairperson_id: chairpersonId,
                meeting_secretary_id: secretaryId,
            };
            const response = isEditMode
                ? await apiClient.put(`/meetings/${initialData.meeting_id}`, payload)
                : await apiClient.post('/meetings', payload);
            
            onSave(response.data.meeting);
            onClose();
        } catch (err) {
            setError(err.response?.data?.message || 'Có lỗi xảy ra.');
        } finally {
            setLoading(false);
        }
    };

    
    // Tạo danh sách TẤT CẢ người dùng để chọn vai trò, không lọc theo người tham dự nữa
    const allUserOptions = allUsers.map(u => ({ value: u.user_id, label: u.full_name }));
    
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
                <h2 className="text-2xl font-bold text-primaryRed mb-6">{isEditMode ? 'Chỉnh sửa Cuộc họp' : 'Tạo cuộc họp mới'}</h2>
                {error && <p className="text-red-500 bg-red-100 p-3 rounded-md mb-4">{error}</p>}
                
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto pr-4">
                    <input type="file" ref={fileInputRef} onChange={handleFileSelectAndUpload} className="hidden" multiple />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Tiêu đề*</label>
                            <input type="text" value={title} onChange={e => setTitle(e.target.value)} required className="w-full p-3 border rounded-md" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Địa điểm*</label>
                            <input type="text" value={location} onChange={e => setLocation(e.target.value)} required className="w-full p-3 border rounded-md" />
                        </div>
                        {user?.role === 'Admin' && (
                             <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Cơ quan tổ chức*</label>
                                <select value={selectedOrgId} onChange={e => setSelectedOrgId(e.target.value)} required className="w-full p-3 border rounded-md bg-white h-[50px]"><option value="">Chọn cơ quan...</option>{organizations.map(org => <option key={org.org_id} value={org.org_id}>{org.org_name}</option>)}</select>
                            </div>
                        )}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Thời gian bắt đầu*</label>
                            <div className="flex gap-2">
                                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} required className="w-full p-3 border rounded-md" />
                                <TimePicker value={startTime} onChange={setStartTime} />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Thời gian kết thúc</label>
                            <div className="flex gap-2">
                                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full p-3 border rounded-md" />
                                <TimePicker value={endTime} onChange={setEndTime} />
                            </div>
                        </div>
                        
                        {/* --- THAY ĐỔI QUAN TRỌNG: Sử dụng `allUserOptions` --- */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Chủ trì cuộc họp</label>
                            <SearchableSelect 
                                options={allUserOptions}
                                value={chairpersonId}
                                onChange={(value) => setChairpersonId(value)}
                                placeholder="Gõ để tìm chủ trì..."
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Thư ký cuộc họp</label>
                            <SearchableSelect 
                                options={allUserOptions}
                                value={secretaryId}
                                onChange={(value) => setSecretaryId(value)}
                                placeholder="Gõ để tìm thư ký..."
                            />
                        </div>
                        {/* --- KẾT THÚC THAY ĐỔI --- */}

                        <div className="md:col-span-2">
                             <label className="block text-sm font-medium text-gray-700 mb-1">Người tham dự*</label>
                             <UserSelectorWeb selectedIds={attendeeIds} setSelectedIds={setAttendeeIds} />
                        </div>
                    </div>

                    <div className="mt-6 border-t pt-4">
                        <h3 className="text-lg font-semibold text-gray-700 mb-2">Chương trình nghị sự</h3>
                        {agenda.map((item, agendaIndex) => (
                             <div key={agendaIndex} className="p-4 bg-gray-50 rounded-md mb-4 border">
                                <div className="flex justify-between items-center mb-2">
                                    <p className="font-semibold">Nội dung {agendaIndex + 1}</p>
                                    <button type="button" onClick={() => removeAgendaItem(agendaIndex)} className="text-red-500 hover:text-red-700">Xóa</button>
                                </div>
                                <input type="text" placeholder="Tiêu đề nội dung" value={item.title} onChange={e => handleAgendaChange(agendaIndex, e.target.value)} className="w-full p-2 border rounded-md mb-2" />
                                
                                {item.documents.map((doc, docIndex) => (
                                    <div key={docIndex} className="flex items-center justify-between p-2 bg-white rounded border mt-2">
                                        <p className="text-gray-700 flex-1 truncate">{doc.doc_name}</p>
                                        {doc.isUploading ? (
                                            <div className="w-5 h-5 border-2 border-t-primaryRed border-gray-200 rounded-full animate-spin"></div>
                                        ) : (
                                            <button type="button" onClick={() => removeDocument(agendaIndex, docIndex)} className="text-gray-500">✕</button>
                                        )}
                                    </div>
                                ))}
                                <button type="button" onClick={() => triggerFileInput(agendaIndex)} className="mt-2 text-sm text-blue-600 hover:text-blue-800">+ Tải lên tài liệu</button>
                            </div>
                        ))}
                        <button type="button" onClick={addAgendaItem} className="w-full p-2 mt-2 text-sm text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300">Thêm nội dung chương trình</button>
                    </div>
                </form>
                <div className="flex justify-end gap-4 mt-8 pt-4 border-t">
                    <button type="button" onClick={onClose} className="px-6 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300">Hủy</button>
                    <button type="submit" disabled={loading} onClick={handleSubmit} className="px-6 py-2 text-white bg-primaryRed rounded-md hover:bg-red-700 disabled:bg-red-300">
                        {loading ? 'Đang lưu...' : (isEditMode ? 'Lưu thay đổi' : 'Tạo cuộc họp')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MeetingFormModal;
