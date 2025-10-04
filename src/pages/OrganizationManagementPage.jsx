import React, { useState, useEffect } from 'react';
import apiClient from '@/api/client';
import OrgFormModal from '@/components/OrgFormModal';
import LeaderManagementModal from '@/components/LeaderManagementModal';
import { UserGroupIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@/context/AuthContext';

// Component con để hiển thị từng dòng và các dòng con/người dùng của nó
const OrgRow = ({ org, level = 0, onEdit, onDelete, onManageLeaders, isAdmin }) => {
    const [isExpanded, setIsExpanded] = useState(true);

    return (
        <>
            <tr 
                className="hover:bg-gray-50"
                onClick={() => org.children && org.children.length > 0 && setIsExpanded(!isExpanded)}
            >
                <td className="px-5 py-3 border-b border-gray-200 text-sm">
                    <div style={{ paddingLeft: `${level * 2}rem` }} className="flex items-center">
                        {(org.children && org.children.length > 0) ? (
                            <div className="mr-2 text-gray-500 p-1 cursor-pointer">
                                <svg className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                            </div>
                        ) : (
                            <span className="w-6 mr-2"></span>
                        )}
                        <span className="font-semibold text-gray-800">{org.org_name}</span>
                    </div>
                </td>
                {/* Conditionally render the entire actions cell */}
                {isAdmin && (
                    <td className="px-5 py-3 border-b border-gray-200 text-sm text-center">
                        <button onClick={(e) => { e.stopPropagation(); onManageLeaders(org); }} className="text-blue-600 hover:text-blue-800 font-medium mr-4 inline-flex items-center">
                            <UserGroupIcon className="h-4 w-4 mr-1" />
                            Lãnh đạo
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); onEdit(org); }} className="text-gray-600 hover:text-primaryRed font-medium mr-4">Sửa</button>
                        <button onClick={(e) => { e.stopPropagation(); onDelete(org); }} className="text-red-600 hover:text-red-800 font-medium">Xóa</button>
                    </td>
                )}
            </tr>
            {isExpanded && (
                <>
                    {org.users && org.users.map(user => (
                        <tr key={`user-${user.user_id}`} className="hover:bg-gray-50">
                            <td colSpan={isAdmin ? 2 : 1} className="px-5 py-2 border-b border-gray-200 text-sm">
                                <div style={{ paddingLeft: `${(level + 1) * 2}rem` }} className="flex items-center text-gray-600">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-gray-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" /></svg>
                                    {user.full_name}
                                </div>
                            </td>
                        </tr>
                    ))}
                    {org.children && org.children.map(child => <OrgRow key={child.org_id} org={child} level={level + 1} onEdit={onEdit} onDelete={onDelete} onManageLeaders={onManageLeaders} isAdmin={isAdmin} />)}
                </>
            )}
        </>
    );
};

const OrganizationManagementPage = () => {
    const { user } = useAuth();
    const isAdmin = user?.role === 'Admin';

    const [orgs, setOrgs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentOrg, setCurrentOrg] = useState(null);
    const [isLeaderModalOpen, setIsLeaderModalOpen] = useState(false);
    const [selectedOrg, setSelectedOrg] = useState(null);

    const fetchOrgs = async () => {
        try {
            const response = await apiClient.get('/users/grouped');
            setOrgs(response.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrgs();
    }, []);

    const handleOpenModal = (org = null) => {
        setCurrentOrg(org);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setCurrentOrg(null);
        setIsModalOpen(false);
    };

    const handleOpenLeaderModal = (org) => {
        setSelectedOrg(org);
        setIsLeaderModalOpen(true);
    };

    const handleSave = () => {
        fetchOrgs();
        handleCloseModal();
    };

    const handleDelete = async (org) => {
        if(window.confirm(`Bạn có chắc muốn xóa "${org.org_name}"?`)){
            try {
                await apiClient.delete(`/organizations/${org.org_id}`);
                fetchOrgs();
            } catch(err) {
                alert(err.response?.data?.message || "Xóa thất bại. Vui lòng thử lại.");
            }
        }
    };

    if (loading) return <p>Đang tải danh sách cơ quan...</p>;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-primaryRed">Quản lý Cơ quan / Đơn vị</h1>
                {isAdmin && (
                    <button onClick={() => handleOpenModal()} className="px-4 py-2 font-bold text-white bg-primaryRed rounded-md hover:bg-red-700 flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>
                        Thêm mới
                    </button>
                )}
            </div>
            <div className="bg-white shadow-md rounded-lg overflow-hidden">
                <table className="min-w-full leading-normal table-fixed">
                    <thead>
                        <tr className="bg-primaryRed text-left text-white uppercase text-sm">
                            <th className={`px-5 py-3 border-b-2 border-red-700 ${isAdmin ? 'w-3/4' : 'w-full'}`}>Tên Cơ quan / Đơn vị / Thành viên</th>
                            {isAdmin && <th className="px-5 py-3 border-b-2 border-red-700 text-center w-1/4">Hành động</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {orgs.map(org => <OrgRow key={org.org_id} org={org} onEdit={handleOpenModal} onDelete={handleDelete} onManageLeaders={handleOpenLeaderModal} isAdmin={isAdmin} />)}
                    </tbody>
                </table>
            </div>
            
            {isAdmin && isModalOpen && (
                <OrgFormModal 
                    isOpen={isModalOpen}
                    onClose={handleCloseModal} 
                    onSave={handleSave} 
                    initialData={currentOrg}
                    orgList={orgs}
                />
            )}
            {isAdmin && isLeaderModalOpen && (
                <LeaderManagementModal 
                    org={selectedOrg}
                    onClose={() => setIsLeaderModalOpen(false)} 
                />
            )}
        </div>
    );
};

export default OrganizationManagementPage;

