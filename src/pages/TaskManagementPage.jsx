import React, { useState, useEffect } from 'react';
import apiClient from '../api/client';
import TaskFormModal from '../components/TaskFormModal';
import Docxtemplater from 'docxtemplater';
import PizZip from 'pizzip';
import { saveAs } from 'file-saver';
import Pagination from '../components/Pagination'; // Import component chung
import { MagnifyingGlassIcon, BuildingOffice2Icon, FireIcon, StarIcon } from '@heroicons/react/24/solid';

const TaskManagementPage = () => {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentTask, setCurrentTask] = useState(null);
    
    // States for filters
    const [selectedStatuses, setSelectedStatuses] = useState(new Set(['pending', 'doing', 'overdue']));
    const [orgFilter, setOrgFilter] = useState('');
    const [searchTerm, setSearchTerm] = useState(''); // State cho từ khóa tìm kiếm
    const [organizations, setOrganizations] = useState([]);

    // States for report export
    const [reportLoading, setReportLoading] = useState(false);
    const [reportError, setReportError] = useState(null);

    // State for status tabs
    const [activeStatusTab, setActiveStatusTab] = useState('incomplete'); // 'all', 'incomplete', 'completed'

    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const TASKS_PER_PAGE = 10;

    const fetchTasks = async () => {
        setLoading(true);
        try {
            const params = {
                page: currentPage,
                limit: TASKS_PER_PAGE,
                dynamicStatus: selectedStatuses.size > 0 ? Array.from(selectedStatuses) : null,
                orgId: orgFilter || null,
                searchTerm: searchTerm || null, // Thêm searchTerm vào params
                sortBy: 'priority,due_date', // [CẬP NHẬT] Ưu tiên sắp xếp theo Mức độ ưu tiên, sau đó đến Hạn hoàn thành
                sortDirection: 'desc,asc',     // [CẬP NHẬT] 'desc' cho priority (urgent > important > normal), 'asc' cho due_date
            };
            const response = await apiClient.get('/tasks', { params });
            setTasks(response.data.tasks || []); // Ensure tasks is an array
            setTotalPages(response.data.totalPages || 1);
        } catch (err) {
            console.error(err);
            setTasks([]); // Set to empty array on error
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

    // [SỬA LỖI] Hợp nhất logic tải lại dữ liệu vào một useEffect duy nhất
    // Lắng nghe tất cả các thay đổi từ filter và trang hiện tại
    useEffect(() => {
        const handler = setTimeout(() => {
            fetchTasks();
        }, 300); // Debounce 300ms

        return () => {
            clearTimeout(handler);
        };
    }, [currentPage, JSON.stringify(Array.from(selectedStatuses)), orgFilter, searchTerm]);

    const handleOpenModal = (task = null) => {
        setCurrentTask(task);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setCurrentTask(null);
        setIsModalOpen(false);
    };

    const handleSave = (savedTask) => {
        // SỬA LỖI: Luôn tải lại toàn bộ danh sách để đảm bảo dữ liệu đầy đủ và chính xác.
        fetchTasks();
        handleCloseModal();
    };

    const handleTabChange = (tab) => {
        setActiveStatusTab(tab);
        setCurrentPage(1); // Reset to first page on tab change
        if (tab === 'all') {
            setSelectedStatuses(new Set());
        } else if (tab === 'incomplete') {
            setSelectedStatuses(new Set(['pending', 'doing', 'overdue']));
        } else if (tab === 'completed') {
            setSelectedStatuses(new Set(['completed_on_time', 'completed_late']));
        }
    };

    const tabOptions = [
        { key: 'all', label: 'Tất cả' },
        { key: 'incomplete', label: 'Chưa hoàn thành' },
        { key: 'completed', label: 'Đã hoàn thành' },
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
                    statusInfo = { text: 'Còn hạn', style: 'bg-green-100 text-green-800' };
                }
            } else {
                 statusInfo = { text: 'Thường xuyên', style: 'bg-gray-100 text-gray-800' };
            }
        }

        return <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusInfo.style}`}>{statusInfo.text}</span>;
    };
    
    // CẢI TIẾN: Hàm để hiển thị tag Mức độ ưu tiên
    const getPriorityTag = (priority) => {
        switch (priority) {
            case 'urgent':
                return <span className="px-2 py-1 text-xs font-semibold text-red-800 bg-red-200 rounded-full">Khẩn</span>;
            case 'important':
                return <span className="px-2 py-1 text-xs font-semibold text-orange-800 bg-orange-200 rounded-full">Quan trọng</span>;
            case 'normal':
            default:
                // Có thể không cần hiển thị gì cho mức "Thông thường" để giao diện đỡ rối
                return <span className="px-2 py-1 text-xs font-semibold text-gray-700 bg-gray-100 rounded-full">Thông thường</span>;
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return <span className="text-gray-400">Chưa có</span>;
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
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

            {/* [CẬP NHẬT] Gộp bộ lọc, tabs, và bảng vào một container duy nhất */}
            <div className="bg-white shadow-lg rounded-xl overflow-hidden">
                <div className="p-6">
                    <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                        <div className="relative w-full md:w-1/3">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                            </div>
                            <input type="text" placeholder="Tìm theo tên công việc..." value={searchTerm} onChange={e => {
                                setSearchTerm(e.target.value);
                                setCurrentPage(1);
                            }} className="p-2 pl-10 border rounded-md w-full focus:ring-primaryRed focus:border-primaryRed" />
                        </div>
                        <div className="relative w-full md:w-1/3">
                             <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <BuildingOffice2Icon className="h-5 w-5 text-gray-400" />
                            </div>
                            <select value={orgFilter} onChange={e => {
                                setOrgFilter(e.target.value);
                                setCurrentPage(1);
                            }} className="p-2 pl-10 border rounded-md bg-white w-full appearance-none focus:ring-primaryRed focus:border-primaryRed">
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
                </div>
                <div className="mt-6 border-b border-gray-200">
                    <nav className="flex -mb-px" aria-label="Tabs">
                    {tabOptions.map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => handleTabChange(tab.key)}
                            className={`${
                                activeStatusTab === tab.key
                                ? 'border-primaryRed text-primaryRed bg-red-50'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                            } whitespace-nowrap py-3 px-4 border-b-2 font-medium text-sm rounded-t-md transition-colors duration-150`}
                        >{tab.label}</button>
                    ))}
                    </nav>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full leading-normal table-fixed">
                        <thead>
                            <tr className="bg-primaryRed text-left text-white uppercase text-sm border-t border-red-600">
                            <th className="px-5 py-3 border-b-2 border-red-700 w-[35%]">Tên công việc</th>
                            <th className="px-5 py-3 border-b-2 border-red-700 w-[20%]">Đơn vị chủ trì</th>
                            <th className="px-5 py-3 border-b-2 border-red-700">Người theo dõi</th>
                            <th className="px-5 py-3 border-b-2 border-red-700 text-center">Hạn hoàn thành</th>
                            <th className="px-5 py-3 border-b-2 border-red-700 text-center">Ưu tiên</th>
                            <th className="px-5 py-3 border-b-2 border-red-700 text-center">Trạng thái</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            // [CẢI TIẾN] Skeleton loader
                            Array.from({ length: 5 }).map((_, index) => (
                                <tr key={index} className="animate-pulse">
                                    <td className="px-5 py-4 border-b border-gray-200"><div className="h-4 bg-gray-200 rounded w-3/4"></div></td>
                                    <td className="px-5 py-4 border-b border-gray-200"><div className="h-4 bg-gray-200 rounded w-1/2"></div></td>
                                    <td className="px-5 py-4 border-b border-gray-200"><div className="h-4 bg-gray-200 rounded w-2/3"></div></td>
                                    <td className="px-5 py-4 border-b border-gray-200"><div className="h-4 bg-gray-200 rounded mx-auto w-1/3"></div></td>
                                    <td className="px-5 py-4 border-b border-gray-200"><div className="h-4 bg-gray-200 rounded mx-auto w-1/2"></div></td>
                                    <td className="px-5 py-4 border-b border-gray-200"><div className="h-4 bg-gray-200 rounded mx-auto w-1/2"></div></td>
                                </tr>
                            ))
                        ) : tasks.length > 0 ? (
                            tasks.map(task => (
                                <tr key={task.task_id} className="hover:bg-red-50 cursor-pointer" onClick={() => handleOpenModal(task)}>
                                    <td className="px-5 py-4 border-b border-red-200 text-sm font-semibold">
                                        <div className="flex items-center gap-2">
                                            {task.priority === 'urgent' && <FireIcon className="h-5 w-5 text-red-500 flex-shrink-0" title="Khẩn" />}
                                            {task.priority === 'important' && <StarIcon className="h-5 w-5 text-yellow-500 flex-shrink-0" title="Quan trọng" />}
                                            <span>{task.title}</span>
                                        </div>
                                    </td>
                                    <td className="px-5 py-4 border-b border-red-200 text-sm">
                                        {task.assignedOrgs && task.assignedOrgs.length > 0
                                            ? task.assignedOrgs.map(org => org.name).join(', ')
                                            : 'N/A'
                                        }
                                    </td>
                                    <td className="px-5 py-4 border-b border-red-200 text-sm">{task.trackers?.map(t => t.full_name).join(', ') || 'N/A'}</td>
                                    <td className="px-5 py-4 border-b border-red-200 text-sm text-center">{formatDate(task.due_date)}</td>
                                    <td className="px-5 py-4 border-b border-red-200 text-sm text-center">{getPriorityTag(task.priority)}</td>
                                    <td className="px-5 py-4 border-b border-red-200 text-sm text-center">{getDynamicStatusChip(task)}</td>
                                </tr>
                            ))
                        ) : (
                            // [CẢI TIẾN] Empty state
                            <tr>
                                <td colSpan="6" className="text-center p-10">
                                    <h3 className="text-lg font-semibold text-gray-600">Không tìm thấy công việc nào</h3>
                                    <p className="text-gray-500 mt-1">Hãy thử thay đổi bộ lọc hoặc tạo một công việc mới.</p>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
                </div>

                <div className="p-4 border-t border-gray-200">
                    <Pagination 
                    currentPage={currentPage} 
                    totalPages={totalPages} 
                    onPageChange={setCurrentPage} 
                    />
                </div>
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
