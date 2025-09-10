import React, { useState, useEffect } from 'react';
import apiClient from '../api/client';
import AddUserModal from '../components/AddUserModal';
import EditUserModal from '../components/EditUserModal';

// Component con cho việc phân trang
const Pagination = ({ currentPage, totalPages, onPageChange }) => {
    if (totalPages <= 1) return null;
    const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
    return (
        <div className="flex justify-center items-center space-x-2 mt-4">
            <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1} className="px-3 py-1 rounded-md bg-gray-200 hover:bg-gray-300 disabled:opacity-50">
                Trước
            </button>
            {pages.map(page => (
                <button 
                    key={page} 
                    onClick={() => onPageChange(page)}
                    className={`px-3 py-1 rounded-md ${currentPage === page ? 'bg-primaryRed text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
                >
                    {page}
                </button>
            ))}
            <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages} className="px-3 py-1 rounded-md bg-gray-200 hover:bg-gray-300 disabled:opacity-50">
                Sau
            </button>
        </div>
    );
};

// Hàm trợ giúp mới để làm phẳng cây thư mục cho bộ lọc
const flattenOrgsForSelect = (orgs, level = 0) => {
    let list = [];
    orgs.forEach(org => {
        list.push({ 
            org_id: org.org_id, 
            org_name: `${'\u00A0'.repeat(level * 4)}${org.org_name}` 
        });
        if (org.children && org.children.length > 0) {
            list = list.concat(flattenOrgsForSelect(org.children, level + 1));
        }
    });
    return list;
};


const UserManagementPage = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [filterOrgId, setFilterOrgId] = useState('');
    const [organizations, setOrganizations] = useState([]); // State mới cho danh sách phẳng

    const fetchUsers = async (page, orgId) => {
        try {
            setLoading(true);
            const params = { page, limit: 20, orgId: orgId || null };
            const response = await apiClient.get('/users', { params });
            setUsers(response.data.users);
            setTotalPages(Math.ceil(response.data.totalCount / 20));
        } catch (err) {
            setError('Không thể tải danh sách người dùng.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers(currentPage, filterOrgId);
    }, [currentPage, filterOrgId]);

    useEffect(() => {
        apiClient.get('/organizations').then(res => {
            // Tạo danh sách phẳng từ dữ liệu cây
            setOrganizations(flattenOrgsForSelect(res.data));
        });
    }, []);

    const handleUserAdded = (newUser) => {
        fetchUsers(currentPage, filterOrgId);
    };
    const handleUserUpdated = (updatedUser) => {
        setUsers(users.map(user => user.user_id === updatedUser.user_id ? updatedUser : user));
    };
    const handleDeleteUser = async (userId, username) => {
        if (window.confirm(`Bạn có chắc muốn xóa người dùng "${username}"?`)) {
            try {
                await apiClient.delete(`/users/${userId}`);
                fetchUsers(currentPage, filterOrgId);
            } catch (err) {
                alert('Xóa người dùng thất bại.');
            }
        }
    };
    const openEditModal = (user) => {
        setCurrentUser(user);
        setIsEditModalOpen(true);
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-primaryRed">Quản lý Người dùng</h1>
                <button onClick={() => setIsAddModalOpen(true)} className="px-4 py-2 font-bold text-white bg-primaryRed rounded-md hover:bg-red-700 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>
                    Thêm người dùng mới
                </button>
            </div>
            
            <div className="mb-4">
                <label className="mr-2">Lọc theo cơ quan:</label>
                <select 
                    value={filterOrgId} 
                    onChange={e => { setFilterOrgId(e.target.value); setCurrentPage(1); }}
                    className="p-2 border rounded-md bg-white"
                >
                    <option value="">Tất cả các cơ quan</option>
                    {/* Sử dụng danh sách đã được làm phẳng và thụt lề */}
                    {organizations.map(org => <option key={org.org_id} value={org.org_id}>{org.org_name}</option>)}
                </select>
            </div>

            <div className="bg-white shadow-md rounded-lg overflow-hidden">
                <table className="min-w-full leading-normal">
                    <thead>
                        <tr className="bg-primaryRed text-left text-white uppercase text-sm">
                            <th className="px-5 py-3 border-b-2 border-red-700">Họ và Tên</th>
                            <th className="px-5 py-3 border-b-2 border-red-700">Tên đăng nhập</th>
                            <th className="px-5 py-3 border-b-2 border-red-700">Email</th>
                            <th className="px-5 py-3 border-b-2 border-red-700">Chức vụ</th>
                            <th className="px-5 py-3 border-b-2 border-red-700">Vai trò</th>
                            <th className="px-5 py-3 border-b-2 border-red-700">Hành động</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="6" className="text-center p-4">Đang tải...</td></tr>
                        ) : users.map((user) => (
                            <tr key={user.user_id} className="hover:bg-gray-100">
                                <td className="px-5 py-4 border-b border-gray-200 text-sm">{user.full_name}</td>
                                <td className="px-5 py-4 border-b border-gray-200 text-sm">{user.username}</td>
                                <td className="px-5 py-4 border-b border-gray-200 text-sm">{user.email}</td>
                                <td className="px-5 py-4 border-b border-gray-200 text-sm">{user.position}</td>
                                <td className="px-5 py-4 border-b border-gray-200 text-sm">{user.role}</td>
                                <td className="px-5 py-4 border-b border-gray-200 text-sm">
                                    <button onClick={() => openEditModal(user)} className="text-gray-600 hover:text-primaryRed font-medium mr-4">Sửa</button>
                                    <button onClick={() => handleDeleteUser(user.user_id, user.username)} className="text-red-600 hover:text-red-800 font-medium">Xóa</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
            
            <AddUserModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onUserAdded={handleUserAdded} />
            <EditUserModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} onUserUpdated={handleUserUpdated} user={currentUser} />
        </div>
    );
};

export default UserManagementPage;

