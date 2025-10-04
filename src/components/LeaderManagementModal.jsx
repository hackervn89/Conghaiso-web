import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '@/api/client';
import { XMarkIcon, UserPlusIcon, TrashIcon, PencilIcon, CheckIcon } from '@heroicons/react/24/outline';

const LeaderManagementModal = ({ org, onClose }) => {
    const [leaders, setLeaders] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // State for adding a new leader
    const [selectedUserId, setSelectedUserId] = useState('');
    const [leaderTitle, setLeaderTitle] = useState('');

    // State for editing an existing leader
    const [editingLeaderId, setEditingLeaderId] = useState(null);
    const [editingTitle, setEditingTitle] = useState('');

    const fetchData = useCallback(async () => {
        if (!org?.org_id) return;
        setLoading(true);
        setError('');
        try {
            const [leadersRes, usersRes] = await Promise.all([
                apiClient.get(`/organizations/${org.org_id}/leaders`),
                apiClient.get(`/organizations/${org.org_id}/users`)
            ]);
            setLeaders(leadersRes.data || []);
            setUsers(usersRes.data || []);
        } catch (err) {
            setError('Không thể tải dữ liệu lãnh đạo hoặc thành viên.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [org?.org_id]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleAddLeader = async (e) => {
        e.preventDefault();
        if (!selectedUserId || !leaderTitle) {
            setError('Vui lòng chọn thành viên và nhập chức danh.');
            return;
        }
        setError('');
        try {
            await apiClient.post(`/organizations/${org.org_id}/leaders`, {
                userId: selectedUserId,
                leaderTitle: leaderTitle,
            });
            await fetchData();
            setSelectedUserId('');
            setLeaderTitle('');
        } catch (err) {
            setError(err.response?.data?.message || 'Thêm lãnh đạo thất bại.');
        }
    };

    const handleDeleteLeader = async (userId) => {
        if (window.confirm('Bạn có chắc chắn muốn xóa vai trò lãnh đạo của thành viên này?')) {
            setError('');
            try {
                await apiClient.delete(`/organizations/${org.org_id}/leaders/${userId}`);
                await fetchData();
            } catch (err) {
                setError(err.response?.data?.message || 'Xóa lãnh đạo thất bại.');
            }
        }
    };

    const handleStartEditing = (leader) => {
        setEditingLeaderId(leader.user_id);
        setEditingTitle(leader.leader_title);
    };

    const handleCancelEditing = () => {
        setEditingLeaderId(null);
        setEditingTitle('');
    };

    const handleUpdateLeader = async (userId) => {
        if (!editingTitle) {
            setError('Chức danh không được để trống.');
            return;
        }
        setError('');
        try {
            await apiClient.put(`/organizations/${org.org_id}/leaders/${userId}`, {
                leaderTitle: editingTitle,
            });
            await fetchData();
            handleCancelEditing();
        } catch (err) {
            setError(err.response?.data?.message || 'Cập nhật chức danh thất bại.');
        }
    };

    const nonLeaderUsers = users.filter(user => !leaders.some(leader => leader.user_id === user.user_id));

    if (!org) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-primaryRed">Quản lý Lãnh đạo: {org.org_name}</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200">
                        <XMarkIcon className="h-6 w-6" />
                    </button>
                </div>

                {error && <p className="text-red-500 bg-red-100 p-3 rounded-md mb-4">{error}</p>}

                <div className="flex-1 overflow-y-auto pr-4">
                    {/* Add Leader Form */}
                    <form onSubmit={handleAddLeader} className="mb-6 p-4 border rounded-md bg-gray-50">
                        <h3 className="text-lg font-semibold text-gray-800 mb-3">Thêm Lãnh đạo mới</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="user-select" className="block text-sm font-medium text-gray-700 mb-1">Chọn thành viên</label>
                                <select id="user-select" value={selectedUserId} onChange={(e) => setSelectedUserId(e.target.value)} className="w-full p-2 border rounded-md bg-white" required>
                                    <option value="">-- Chọn một thành viên --</option>
                                    {nonLeaderUsers.map(user => (
                                        <option key={user.user_id} value={user.user_id}>{user.full_name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="leader-title" className="block text-sm font-medium text-gray-700 mb-1">Chức danh</label>
                                <input id="leader-title" type="text" value={leaderTitle} onChange={(e) => setLeaderTitle(e.target.value)} placeholder="Ví dụ: Trưởng ban" className="w-full p-2 border rounded-md" required />
                            </div>
                        </div>
                        <div className="text-right mt-4">
                            <button type="submit" className="inline-flex items-center px-4 py-2 text-white bg-primaryRed rounded-md hover:bg-red-700">
                                <UserPlusIcon className="h-5 w-5 mr-2" />
                                Lưu Lãnh đạo
                            </button>
                        </div>
                    </form>

                    {/* Current Leaders List */}
                    <div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-3">Danh sách Lãnh đạo hiện tại</h3>
                        {loading ? (
                            <p>Đang tải...</p>
                        ) : leaders.length > 0 ? (
                            <ul className="space-y-2">
                                {leaders.map(leader => (
                                    <li key={leader.user_id} className="flex items-center justify-between p-3 bg-white rounded-md border">
                                        {editingLeaderId === leader.user_id ? (
                                            <div className="flex-1 flex items-center gap-2">
                                                <input
                                                    type="text"
                                                    value={editingTitle}
                                                    onChange={(e) => setEditingTitle(e.target.value)}
                                                    className="w-full p-1 border rounded-md"
                                                    autoFocus
                                                />
                                                <button onClick={() => handleUpdateLeader(leader.user_id)} className="p-2 rounded-full text-green-600 hover:bg-green-100">
                                                    <CheckIcon className="h-5 w-5" />
                                                </button>
                                                <button onClick={handleCancelEditing} className="p-2 rounded-full text-gray-500 hover:bg-gray-100">
                                                    <XMarkIcon className="h-5 w-5" />
                                                </button>
                                            </div>
                                        ) : (
                                            <>
                                                <div>
                                                    <p className="font-semibold text-gray-900">{leader.full_name}</p>
                                                    <p className="text-sm text-gray-600">{leader.leader_title}</p>
                                                </div>
                                                <div className="flex items-center">
                                                    <button onClick={() => handleStartEditing(leader)} className="p-2 rounded-full text-gray-500 hover:bg-blue-100 hover:text-blue-600" title="Sửa chức danh">
                                                        <PencilIcon className="h-5 w-5" />
                                                    </button>
                                                    <button onClick={() => handleDeleteLeader(leader.user_id)} className="p-2 rounded-full text-gray-500 hover:bg-red-100 hover:text-red-600" title="Xóa vai trò lãnh đạo">
                                                        <TrashIcon className="h-5 w-5" />
                                                    </button>
                                                </div>
                                            </>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-gray-500">Chưa có lãnh đạo nào trong đơn vị này.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LeaderManagementModal;