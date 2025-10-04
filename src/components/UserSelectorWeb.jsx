import React, { useState, useEffect } from 'react';
import apiClient from '../api/client';
import { UserIcon, ChevronDownIcon } from '@heroicons/react/24/outline';

// Hàm đệ quy để lọc người dùng có vai trò Admin/Secretary ra khỏi cây dữ liệu
const filterUsersInGroups = (groups) => {
    if (!Array.isArray(groups)) return [];
    // Sử dụng reduce để xây dựng một mảng mới, tránh thay đổi (mutate) mảng gốc
    return groups.reduce((acc, group) => {
        // Lọc người dùng dựa trên full_name vì API không trả về 'role'
        const filteredUsers = (group.users || []).filter(
            user => user.full_name !== 'Quản trị viên Hệ thống' && !user.full_name.startsWith('Văn thư')
        );
        // Lọc đệ quy các nhóm con
        const filteredChildren = filterUsersInGroups(group.children);
        // Chỉ thêm nhóm vào kết quả nếu nó có người dùng hoặc có nhóm con (đã được lọc)
        if (filteredUsers.length > 0 || filteredChildren.length > 0) {
            // Thêm một bản sao của nhóm với dữ liệu đã được lọc
            acc.push({ ...group, users: filteredUsers, children: filteredChildren });
        }
        return acc;
    }, []);
};

// Hàm đệ quy để lấy tất cả ID người dùng trong một nhánh
const getAllUserIdsInBranch = (group) => {
    let ids = group.users ? group.users.map(u => u.user_id) : [];
    if (group.children && group.children.length > 0) {
        group.children.forEach(child => {
            ids = [...ids, ...getAllUserIdsInBranch(child)];
        });
    }
    return ids;
};

// Component con, sử dụng đệ quy để hiển thị cây
const OrganizationGroup = ({ group, selectedIds, onUserSelect, onGroupSelect, level = 0 }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    const userIdsInBranch = getAllUserIdsInBranch(group);
    const isAllSelected = userIdsInBranch.length > 0 && userIdsInBranch.every(id => selectedIds.includes(id));

    return (
        <div className={`ml-${level * 3}`}>
            {/* Header của Nhóm */}
            <div 
                className="flex items-center px-2 py-1 rounded-md hover:bg-red-50 cursor-pointer transition-colors duration-150"
                onClick={() => setIsExpanded(!isExpanded)}
            >                
                <label 
                    className="relative inline-flex items-center cursor-pointer"
                    onClick={(e) => e.stopPropagation()}
                >
                    <input
                        type="checkbox"
                        className="appearance-none h-4 w-4 border rounded border-primaryRed checked:bg-primaryRed focus:ring-primaryRed"
                        checked={isAllSelected}
                        onChange={(e) => {
                            e.stopPropagation();
                            onGroupSelect(userIdsInBranch);
                        }}
                    />
                    {isAllSelected && (
                        <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white text-xs font-bold">
                            ✓
                        </span>
                    )}
                </label>                                                         
                <span className="ml-2 text-sm font-medium text-red-700 flex-1 select-none">
                    {group.org_name} 
                </span>
                {group.children && group.children.length > 0 && (
                    <ChevronDownIcon className={`h-4 w-4 text-red-500 transition-transform duration-200 ${isExpanded ? '' : '-rotate-90'}`} />
                )}
            </div>

            {/* Danh sách con */}
            {isExpanded && (
                <div className="pl-4 border-l border-gray-200 ml-2 pt-0.5">
                    {/* Hiển thị người dùng */}
                    {group.users && group.users.map(user => (
                        <div 
                            key={user.user_id} 
                            className="flex items-center px-1.5 py-0.5 rounded-md hover:bg-red-50 transition-colors duration-150 cursor-pointer"
                            onClick={() => onUserSelect(user.user_id)}
                        >
                            <label 
                                className="relative inline-flex items-center cursor-pointer"
                                onClick={(e) => e.stopPropagation()} // Ngăn sự kiện nổi bọt
                            >
                                <input
                                    type="checkbox"
                                    className="appearance-none h-4 w-4 border rounded border-primaryRed checked:bg-primaryRed focus:ring-primaryRed"
                                    checked={selectedIds.includes(user.user_id)}
                                    onChange={() => onUserSelect(user.user_id)} // Xử lý thay đổi ở đây
                                />
                                {selectedIds.includes(user.user_id) && (
                                    <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white text-xs font-bold">
                                        ✓
                                    </span>
                                )}
                            </label>
                            <UserIcon className="h-4 w-4 ml-2 mr-1.5 text-red-400" />
                            <label className="text-sm text-gray-600 select-none">{user.full_name}</label>
                        </div>
                    ))}
                    {/* Gọi đệ quy để render các đơn vị con */}
                    {group.children && group.children.map(childGroup => (
                        <OrganizationGroup
                            key={childGroup.org_id}
                            group={childGroup}
                            selectedIds={selectedIds}
                            onUserSelect={onUserSelect}
                            onGroupSelect={onGroupSelect}
                            level={level + 1}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

const UserSelectorWeb = ({ selectedIds, setSelectedIds }) => {
    const [groupedUsers, setGroupedUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchGroupedUsers = async () => {
            try {
                const response = await apiClient.get('/users/grouped');
                const filteredData = filterUsersInGroups(response.data || []); // Lọc người dùng Admin/Secretary
                setGroupedUsers(filteredData);

            } catch (err) {
                setError('Không thể tải danh sách người dùng.');
            } finally {
                setLoading(false);
            }
        };
        fetchGroupedUsers();
    }, []);

    const handleUserSelect = (userId) => {
        const newSelectedIds = new Set(selectedIds);
        if (newSelectedIds.has(userId)) {
            newSelectedIds.delete(userId);
        } else {
            newSelectedIds.add(userId);
        }
        setSelectedIds(Array.from(newSelectedIds));
    };
    
    const handleGroupSelect = (userIdsInBranch) => {
        const newSelectedIds = new Set(selectedIds);
        const isAllSelected = userIdsInBranch.length > 0 && userIdsInBranch.every(id => selectedIds.includes(id));

        if (isAllSelected) {
            userIdsInBranch.forEach(id => newSelectedIds.delete(id));
        } else {
            userIdsInBranch.forEach(id => newSelectedIds.add(id));
        }
        setSelectedIds(Array.from(newSelectedIds));
    };

    if (loading) return <p>Đang tải danh sách người dùng...</p>;
    if (error) return <p className="text-red-500">{error}</p>;

    return (
        <div className="border rounded-md p-1 space-y-1 max-h-72 overflow-y-auto bg-white">
            {groupedUsers.map(group => (
                <OrganizationGroup 
                    key={group.org_id}
                    group={group}
                    selectedIds={selectedIds}
                    onUserSelect={handleUserSelect}
                    onGroupSelect={handleGroupSelect}
                />
            ))}
        </div>
    );
};

export default UserSelectorWeb;