import React, { useState, useEffect } from 'react';
import apiClient from '../api/client';

const OrgFormModal = ({ isOpen, onClose, onSave, initialData, orgList }) => {
    const isEditMode = !!initialData;
    const [name, setName] = useState('');
    const [parentId, setParentId] = useState(null);
    const [displayOrder, setDisplayOrder] = useState(10); // Thêm state mới
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            if (isEditMode && initialData) {
                setName(initialData.org_name || '');
                setParentId(initialData.parent_id || null);
                setDisplayOrder(initialData.display_order || 10); // Cập nhật state
            } else {
                setName('');
                setParentId(null);
                setDisplayOrder(10);
            }
            setError('');
        }
    }, [isOpen, initialData, isEditMode]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const payload = { name, parentId, display_order: displayOrder };
            let response;
            if (isEditMode) {
                response = await apiClient.put(`/organizations/${initialData.org_id}`, payload);
            } else {
                response = await apiClient.post('/organizations', payload);
            }
            onSave(response.data);
            onClose();
        } catch (err) {
            setError(err.response?.data?.message || 'Có lỗi xảy ra.');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

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
    const flatOrgList = flattenOrgs(orgList);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-lg">
                <h2 className="text-2xl font-bold text-primaryRed mb-6">{isEditMode ? 'Chỉnh sửa' : 'Thêm mới'} Cơ quan / Đơn vị</h2>
                {error && <p className="text-red-500 bg-red-100 p-3 rounded-md mb-4">{error}</p>}
                
                <form onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Tên Cơ quan / Đơn vị*</label>
                            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className="w-full p-3 border rounded-md" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Thuộc Cơ quan cha</label>
                            <select value={parentId || ''} onChange={(e) => setParentId(e.target.value || null)} className="w-full p-3 border rounded-md bg-white h-[50px]">
                                <option value="">-- Là cơ quan gốc --</option>
                                {flatOrgList.map(org => (
                                     <option key={org.org_id} value={org.org_id} disabled={isEditMode && org.org_id === initialData.org_id}>
                                        {'\u00A0'.repeat(org.level * 4)} {org.org_name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        {/* Ô nhập liệu mới cho Thứ tự hiển thị */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Thứ tự hiển thị</label>
                            <input type="number" value={displayOrder} onChange={(e) => setDisplayOrder(parseInt(e.target.value, 10))} className="w-full p-3 border rounded-md" />
                        </div>
                    </div>
                    <div className="flex justify-end gap-4 mt-8 pt-4 border-t">
                        <button type="button" onClick={onClose} className="px-6 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300">
                            Hủy
                        </button>
                        <button type="submit" disabled={loading} className="px-6 py-2 text-white bg-primaryRed rounded-md hover:bg-red-700 disabled:bg-red-300">
                            {loading ? 'Đang lưu...' : 'Lưu'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default OrgFormModal;

