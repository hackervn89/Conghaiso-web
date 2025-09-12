import React from 'react';

const priorityStyles = {
    normal: { bg: 'bg-gray-200', text: 'text-gray-800' },
    important: { bg: 'bg-yellow-200', text: 'text-yellow-800' },
    urgent: { bg: 'bg-red-200', text: 'text-red-800' },
};

const priorityLabels = {
    normal: 'Thông thường',
    important: 'Quan trọng',
    urgent: 'Khẩn',
};


const TaskCard = ({ task, onEdit }) => {
    const formatDate = (dateString) => {
        if (!dateString) return 'Chưa có';
        return new Date(dateString).toLocaleDateString('vi-VN');
    };

    const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'completed';

    const priorityStyle = priorityStyles[task.priority] || priorityStyles.normal;

    return (
        <div 
            className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => onEdit(task)}
        >
            <div className="flex justify-between items-start">
                <p className="font-bold text-gray-800 pr-2">{task.title}</p>
                <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${priorityStyle.bg} ${priorityStyle.text}`}>
                    {priorityLabels[task.priority]}
                </span>
            </div>
            <p className="text-sm text-gray-600 mt-2 line-clamp-2">{task.description || 'Không có mô tả chi tiết.'}</p>
            <div className="mt-4 pt-3 border-t border-gray-100 text-xs text-gray-500">
                <p>
                    <span className="font-semibold">Đơn vị chủ trì:</span> {task.assigned_orgs?.map(org => org.org_name).join(', ') || 'Chưa giao'}
                </p>
                <div className={`flex justify-between items-center mt-1 ${isOverdue ? 'text-red-600 font-bold' : ''}`}>
                    <span>Hạn: {formatDate(task.due_date)}</span>
                    {task.status === 'completed' && <span>HT: {formatDate(task.completed_at)}</span>}
                </div>
            </div>
        </div>
    );
};

export default TaskCard;

