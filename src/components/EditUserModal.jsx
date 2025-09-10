import React, { useState, useEffect } from 'react';
import apiClient from '../api/client';
import OrgCheckboxTree from './OrgCheckboxTree'; // Import component mới

const EditUserModal = ({ isOpen, onClose, onUserUpdated, user }) => {
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [position, setPosition] = useState('');
    const [role, setRole] = useState('Attendee');
    const [selectedOrgIds, setSelectedOrgIds] = useState(new Set());
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && user) {
            apiClient.get(`/users/${user.user_id}`).then(res => {
                const userData = res.data;
                setFullName(userData.full_name || '');
                setEmail(userData.email || '');
                setPosition(userData.position || '');
                setRole(userData.role || 'Attendee');
                setSelectedOrgIds(new Set(userData.organizationIds || []));
            }).catch(() => setError("Không thể tải chi tiết người dùng."));
        }
    }, [isOpen, user]);

    const handleOrgSelectionChange = (orgId) => {
        const newSelection = new Set(selectedOrgIds);
        if (newSelection.has(orgId)) newSelection.delete(orgId);
        else newSelection.add(orgId);
        setSelectedOrgIds(newSelection);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const response = await apiClient.put(`/users/${user.user_id}`, {
                fullName, email, position, role,
                organizationIds: Array.from(selectedOrgIds),
            });
            onUserUpdated(response.data.user);
            onClose();
        } catch (err) {
            setError(err.response?.data?.message || 'Có lỗi xảy ra.');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen || !user) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-2xl">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-primaryRed">Chỉnh sửa thông tin người dùng</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-3xl">&times;</button>
                </div>
                <p className="mb-4">Tên đăng nhập: <span className="font-semibold">{user.username}</span> (không thể thay đổi)</p>
                {error && <p className="text-red-500 bg-red-100 p-3 rounded-md mb-4">{error}</p>}
                
                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Họ và Tên*</label>
                            <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} required className="w-full p-3 border rounded-md" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email*</label>
                            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full p-3 border rounded-md" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Chức vụ</label>
                            <input type="text" value={position} onChange={(e) => setPosition(e.target.value)} className="w-full p-3 border rounded-md" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Vai trò*</label>
                            <select value={role} onChange={(e) => setRole(e.target.value)} className="w-full p-3 border rounded-md bg-white h-[50px]">
                                <option value="Attendee">Người tham dự</option>
                                <option value="Secretary">Văn thư</option>
                                <option value="Admin">Admin</option>
                            </select>
                        </div>
                    </div>
                    
                    <div className="mt-6 border-t pt-4">
                        <label className="block text-base font-semibold text-gray-800 mb-2">Chọn Cơ quan / Đơn vị</label>
                        <OrgCheckboxTree selectedIds={selectedOrgIds} onSelectionChange={handleOrgSelectionChange} />
                    </div>

                    <div className="flex justify-end gap-4 mt-8 pt-4 border-t">
                        <button type="button" onClick={onClose} className="px-6 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300">Hủy</button>
                        <button type="submit" disabled={loading} className="px-6 py-2 text-white bg-primaryRed rounded-md hover:bg-red-700 disabled:bg-red-300">
                            {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditUserModal;

