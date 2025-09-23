import React, { useState, useEffect } from 'react';
import apiClient from '../api/client';
import TaskFormModal from '../components/TaskFormModal';
import Docxtemplater from 'docxtemplater';
import PizZip from 'pizzip';
import { saveAs } from 'file-saver';

const TaskManagementPage = () => {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentTask, setCurrentTask] = useState(null);
    
    // States for filters
    const [selectedStatuses, setSelectedStatuses] = useState(new Set());
    const [orgFilter, setOrgFilter] = useState('');
    const [organizations, setOrganizations] = useState([]);

    // States for report export
    const [reportLoading, setReportLoading] = useState(false);
    const [reportError, setReportError] = useState(null);

    const fetchTasks = async () => {
        setLoading(true);
        try {
            const params = {
                dynamicStatus: selectedStatuses.size > 0 ? Array.from(selectedStatuses) : null,
                orgId: orgFilter || null,
            };
            const response = await apiClient.get('/tasks', { params });
            setTasks(response.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };
    
    useEffect(() => {
        // Fetch orgs for the filter dropdown
        apiClient.get('/organizations').then(res => {
            const flattenOrgs = (orgs, level = 0) => {
                let list = [];
                orgs.forEach(org => {
                    list.push({ ...org, level });
                    if (org.children && org.children.length > 0) {
                        list = list.concat(flattenOrgs(org.children, level + 1));
                    }
                });
                return list;
            };
            setOrganizations(flattenOrgs(res.data));
        });
    }, []);

    const handleExport = async () => {
        if (window.confirm('Bạn có muốn xuất công văn nhắc việc không?')) {
            setReportLoading(true);
            setReportError(null);
            try {
                const params = {
                    status: 'on_time,overdue', // Chỉ lấy công việc còn hạn và trễ hạn
                    organizationId: orgFilter || null, // Use current organization filter
                };
                const response = await apiClient.get('/reports/tasks-by-organization', { params });
                const data = response.data;

                // Add org_number and format due_date
                const processedOrganizations = data.organizations.map((org, index) => ({
                    ...org,
                    org_number: index + 1,
                    tasks: org.tasks.map(task => ({
                        ...task,
                        due_date: task.due_date ? new Date(task.due_date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : 'Chưa có',
                    })),
                }));

                const orgNames = processedOrganizations.map(org => org.org_name);
                let orgListString = '';
                if (orgNames.length > 0) {
                    orgListString = orgNames.map((name, index) => {
                        if (index === orgNames.length - 1) {
                            return `- ${name}.`; // Last item gets a period
                        }
                        return `- ${name},`; // Other items get a comma
                    }).join('\n'); // Join with newline for line breaks
                }

                const reportData = {
                    ...data,
                    organizations: processedOrganizations,
                    org_list_string: orgListString, // New field for the list of organizations
                };

                // Load template
                const templateResponse = await fetch('/templates/Template_CV_nhacviec.docx');
                const content = await templateResponse.arrayBuffer();

                const zip = new PizZip(content);
                const doc = new Docxtemplater(zip, {
                    paragraphLoop: true,
                    linebreaks: true,
                });

                doc.setData(reportData);
                doc.render();

                const out = doc.getZip().generate({
                    type: 'blob',
                    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                });

                saveAs(out, 'CV đôn đốc công việc.docx');
                alert('Công văn nhắc nhở đã được xuất thành công!');

            } catch (err) {
                console.error('Lỗi khi xuất công văn nhắc nhở:', err);
                setReportError('Không thể xuất công văn nhắc nhở. Vui lòng kiểm tra console để biết chi tiết.');
                alert('Đã xảy ra lỗi khi xuất công văn nhắc nhở.');
            } finally {
                setReportLoading(false);
            }
        }
    };

    const statusFilterString = Array.from(selectedStatuses).sort().join(',');

    useEffect(() => {
        fetchTasks();
    }, [statusFilterString, orgFilter]); // Refetch when filters change

    const handleOpenModal = (task = null) => {
        setCurrentTask(task);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setCurrentTask(null);
        setIsModalOpen(false);
    };

    const handleSave = () => {
        fetchTasks(); // Reload the list after saving
        handleCloseModal();
    };

    const handleStatusChange = (status) => {
        const newStatuses = new Set(selectedStatuses);
        if (newStatuses.has(status)) {
            newStatuses.delete(status);
        } else {
            newStatuses.add(status);
        }
        setSelectedStatuses(newStatuses);
    };

    const statusOptions = [
        { value: 'on_time', label: 'Còn hạn' },
        { value: 'overdue', label: 'Trễ hạn' },
        { value: 'completed_on_time', label: 'Hoàn thành đúng hạn' },
        { value: 'completed_late', label: 'Hoàn thành trễ hạn' },        
    ];

    const getDynamicStatusChip = (task) => {
        const now = new Date();
        now.setHours(0, 0, 0, 0); // Chuẩn hóa về đầu ngày để so sánh
        const dueDate = task.due_date ? new Date(task.due_date) : null;
        const completedAt = task.completed_at ? new Date(task.completed_at) : null;

        let statusInfo = {
            text: 'Mới',
            style: 'bg-gray-100 text-gray-800'
        };

        if (task.status === 'completed') {
            if (completedAt && dueDate && completedAt > dueDate) {
                statusInfo = { text: 'Hoàn thành trễ hạn', style: 'bg-yellow-100 text-yellow-800' };
            } else {
                statusInfo = { text: 'Hoàn thành đúng hạn', style: 'bg-green-100 text-green-800' };
            }
        } else { // Chưa hoàn thành (new hoặc in_progress)
            if (dueDate) {
                if (now > dueDate) {
                    statusInfo = { text: 'Trễ hạn', style: 'bg-red-100 text-red-800' };
                } else {
                    statusInfo = { text: 'Còn hạn', style: 'bg-blue-100 text-blue-800' };
                }
            } else {
                 statusInfo = { text: 'Thường xuyên', style: 'bg-gray-100 text-gray-800' };
            }
        }

        return <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusInfo.style}`}>{statusInfo.text}</span>;
    };
    
    const formatDate = (dateString) => {
        if (!dateString) return <span className="text-gray-400">Chưa có</span>;
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN');
    };


    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-primaryRed">Quản lý Công việc</h1>
                                <button onClick={() => handleOpenModal()} className="p-2 md:px-4 md:py-2 font-bold text-white bg-primaryRed rounded-md hover:bg-red-700 flex items-center gap-2">
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>
                    <span className="hidden md:inline">Giao việc mới</span>
                </button>
            </div>

            {/* [CẬP NHẬT] Filters với các trạng thái động */}
            <div className="mb-4 bg-white p-4 rounded-md shadow-sm">
                <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                    <div className="flex items-center gap-4 w-full md:w-auto">
                        <select value={orgFilter} onChange={e => setOrgFilter(e.target.value)} className="p-2 border rounded-md bg-white w-full">
                            <option value="">Tất cả đơn vị</option>
                            {organizations.map(org => <option key={org.org_id} value={org.org_id}>{ '\u00A0'.repeat(org.level * 4) }{org.org_name}</option>)}
                        </select>
                    </div>
                    <button
                        onClick={handleExport}
                        disabled={reportLoading}
                        className="w-full md:w-auto px-3 py-2 text-sm md:px-4 md:py-2 md:text-base font-bold text-white bg-blue-500 rounded-md hover:bg-blue-700 flex items-center justify-center gap-2 disabled:bg-gray-400"
                    >
                        {reportLoading ? 'Đang xuất...' : 'Xuất Công văn nhắc việc'}
                    </button>
                </div>
                <div className="flex items-center gap-4 mt-4">
                    <span className="text-sm font-medium text-red-700">Lọc theo trạng thái:</span>
                    {statusOptions.map(option => (
                        <div key={option.value} className="flex items-center">
                            <input
                                type="checkbox"
                                id={`status-${option.value}`}
                                checked={selectedStatuses.has(option.value)}
                                onChange={() => handleStatusChange(option.value)}
                                className="h-4 w-4 rounded border-gray-300 text-primaryRed focus:ring-red-400"
                            />
                            <label htmlFor={`status-${option.value}`} className="ml-2 text-sm text-gray-700">{option.label}</label>
                        </div>
                    ))}
                </div>
            </div>
            
            <div className="bg-white shadow-md rounded-lg overflow-x-auto">
                <table className="min-w-full leading-normal table-fixed">
                     <thead>
                        <tr className="bg-primaryRed text-left text-white uppercase text-sm">
                            <th className="px-5 py-3 border-b-2 border-red-700 w-2/5">Tên công việc</th>
                            <th className="px-5 py-3 border-b-2 border-red-700 w-1/5">Đơn vị chủ trì</th>
                            <th className="px-5 py-3 border-b-2 border-red-700">Người theo dõi</th>
                            <th className="px-5 py-3 border-b-2 border-red-700 text-center">Hạn hoàn thành</th>
                            <th className="px-5 py-3 border-b-2 border-red-700 text-center">Trạng thái</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                             <tr><td colSpan="5" className="text-center p-4">Đang tải danh sách công việc...</td></tr>
                        ) : tasks.map(task => (
                            <tr key={task.task_id} className="hover:bg-red-50 cursor-pointer" onClick={() => handleOpenModal(task)}>
                                <td className="px-5 py-4 border-b border-red-200 text-sm font-semibold">{task.title}</td>
                                <td className="px-5 py-4 border-b border-red-200 text-sm">{task.assigned_orgs?.map(o => o.org_name).join(', ') || 'N/A'}</td>
                                <td className="px-5 py-4 border-b border-red-200 text-sm">{task.trackers?.map(t => t.full_name).join(', ') || 'N/A'}</td>
                                <td className="px-5 py-4 border-b border-red-200 text-sm text-center">{formatDate(task.due_date)}</td>
                                <td className="px-5 py-4 border-b border-red-200 text-sm text-center">{getDynamicStatusChip(task)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <TaskFormModal 
                isOpen={isModalOpen} 
                onClose={handleCloseModal} 
                onSave={handleSave} 
                taskData={currentTask}
            />
        </div>
    );
};

export default TaskManagementPage;