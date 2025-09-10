import React, { useState, useEffect } from 'react';
import apiClient from '../api/client';

// Hàm đệ quy để lấy tất cả ID người dùng trong một nhánh (bao gồm cả các nhánh con)
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
    const [isExpanded, setIsExpanded] = useState(true); // Mặc định mở ở cấp đầu

    const userIdsInBranch = getAllUserIdsInBranch(group);
    const isAllSelected = userIdsInBranch.length > 0 && userIdsInBranch.every(id => selectedIds.includes(id));

    return (
        <div style={{ marginLeft: `${level * 1.5}rem` }} className="my-2">
            <div className="flex items-center bg-gray-50 p-2 rounded-t-md">
                <input
                    type="checkbox"
                    className="h-5 w-5 rounded text-primaryRed focus:ring-red-400"
                    checked={isAllSelected}
                    onChange={() => onGroupSelect(userIdsInBranch)}
                />
                <label className="ml-3 font-semibold text-gray-800 flex-1 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
                    {group.org_name}
                </label>
                {group.children && group.children.length > 0 && (
                    <button type="button" onClick={() => setIsExpanded(!isExpanded)} className="p-1">
                        <svg className={`w-5 h-5 text-gray-500 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                    </button>
                )}
            </div>
            {isExpanded && (
                <div className="border-l border-r border-b p-2 rounded-b-md">
                    {/* Hiển thị người dùng trực thuộc cơ quan hiện tại */}
                    {group.users && group.users.map(user => (
                        <div key={user.user_id} className="flex items-center my-1 ml-2">
                            <input
                                type="checkbox"
                                className="h-4 w-4 rounded text-primaryRed focus:ring-red-400"
                                checked={selectedIds.includes(user.user_id)}
                                onChange={() => onUserSelect(user.user_id)}
                            />
                            <label className="ml-3 text-gray-700">{user.full_name}</label>
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
                // API /users/grouped sẽ gọi đến hàm findAllGroupedByOrganization
                const response = await apiClient.get('/users/grouped');
                setGroupedUsers(response.data);
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
        <div className="border rounded-md p-4 max-h-64 overflow-y-auto bg-white">
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