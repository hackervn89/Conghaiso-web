import React, { useState, useEffect } from 'react';
import apiClient from '../api/client';

// Component con, sử dụng đệ quy để hiển thị cây với giao diện đã nâng cấp
const OrgCheckbox = ({ org, selectedIds, onSelectionChange, level = 0 }) => {
    // Mặc định, các nhánh sẽ được đóng lại
    const [isExpanded, setIsExpanded] = useState(false);
    const isSelected = selectedIds.has(org.org_id);

    return (
        <div style={{ marginLeft: `${level * 1.5}rem` }} className="my-1">
            <div 
                className="flex items-center p-2 rounded-md hover:bg-red-50 transition-colors cursor-pointer"
                // Nhấn vào toàn bộ dòng để đóng/mở
                onClick={() => org.children && org.children.length > 0 && setIsExpanded(!isExpanded)}
            >
                <input 
                    type="checkbox" 
                    id={`org-${org.org_id}`}
                    checked={isSelected}
                    onChange={() => onSelectionChange(org.org_id)}
                    // Ngăn sự kiện click của dòng cha bị kích hoạt khi nhấn vào checkbox
                    onClick={(e) => e.stopPropagation()}
                    className="h-4 w-4 rounded border-gray-300 text-primaryRed focus:ring-red-400"
                />
                {/* Loại bỏ htmlFor để tách biệt hành động click của label */}
                <label className="ml-3 text-gray-800 flex-1 cursor-pointer">
                    {org.org_name}
                </label>
                {/* Biểu tượng mũi tên thay cho [+] [-] */}
                {org.children && org.children.length > 0 && (
                    <svg className={`w-5 h-5 text-gray-500 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                    </svg>
                )}
            </div>
            {isExpanded && org.children && org.children.length > 0 && (
                <div className="mt-1 border-l-2 border-gray-200 pl-2">
                    {org.children.map(childOrg => (
                        <OrgCheckbox key={childOrg.org_id} org={childOrg} selectedIds={selectedIds} onSelectionChange={onSelectionChange} level={level + 1} />
                    ))}
                </div>
            )}
        </div>
    );
};

// Component cha, quản lý việc tải dữ liệu
const OrgCheckboxTree = ({ selectedIds, onSelectionChange }) => {
    const [organizations, setOrganizations] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchOrgs = async () => {
            try {
                const response = await apiClient.get('/organizations');
                setOrganizations(response.data);
            } catch (err) {
                console.error("Không thể tải danh sách cơ quan", err);
            } finally {
                setLoading(false);
            }
        };
        fetchOrgs();
    }, []);

    if (loading) return <p>Đang tải danh sách cơ quan...</p>;

    return (
        <div className="border rounded-md p-2 max-h-56 overflow-y-auto bg-white">
            {organizations.map(org => (
                <OrgCheckbox key={org.org_id} org={org} selectedIds={selectedIds} onSelectionChange={onSelectionChange} />
            ))}
        </div>
    );
};


export default OrgCheckboxTree;

