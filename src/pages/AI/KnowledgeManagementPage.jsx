import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '../../api/client';
import Pagination from '../../components/Pagination'; // Giả sử component này đã tồn tại
import KnowledgeIngestModal from '../../components/AI/KnowledgeIngestModal'; // Task FEW-02
import KnowledgeEditModal from '../../components/AI/KnowledgeEditModal'; // Task FEW-03

const KnowledgeManagementPage = () => {
    const [knowledge, setKnowledge] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
    const [isIngestModalOpen, setIsIngestModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedKnowledgeId, setSelectedKnowledgeId] = useState(null);

    const fetchKnowledge = useCallback(async (page = 1) => {
        setLoading(true);
        try {
            const response = await apiClient.get(`/knowledge?page=${page}&limit=15`);
            setKnowledge(response.data.knowledge || []); // Sửa: Dữ liệu nằm trong key 'knowledge'
            setPagination({
                page: response.data.page || 1,
                pages: response.data.pages || 1,
                total: response.data.total || 0,
            });
            setError(null);
        } catch (err) {
            setError('Không thể tải dữ liệu tri thức.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchKnowledge(1);
    }, [fetchKnowledge]);

    const handlePageChange = (newPage) => {
        fetchKnowledge(newPage);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Bạn có chắc chắn muốn xóa mẩu tri thức này không?')) {
            try {
                await apiClient.delete(`/knowledge/${id}`);
                alert('Xóa thành công!');
                fetchKnowledge(pagination.page); // Tải lại trang hiện tại
            } catch (err) {
                alert('Xóa thất bại.');
                console.error(err);
            }
        }
    };

    const handleOpenEditModal = (id) => {
        setSelectedKnowledgeId(id);
        setIsEditModalOpen(true);
    };

    const handleModalCloseAndRefresh = () => {
        const isCreatingNew = isIngestModalOpen; // Kiểm tra xem có phải đang đóng modal tạo mới không
        setIsIngestModalOpen(false);
        setIsEditModalOpen(false);
        setSelectedKnowledgeId(null);

        // Nếu là tạo mới, quay về trang 1 để xem dữ liệu mới nhất.
        // Nếu là sửa, chỉ cần tải lại trang hiện tại.
        fetchKnowledge(isCreatingNew ? 1 : pagination.page);
    };

    return (
        <div className="container mx-auto p-4">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-primaryRed">Quản lý Tri thức AI</h1>
                <button
                    onClick={() => setIsIngestModalOpen(true)}
                    className="px-4 py-2 font-semibold text-white bg-primaryRed rounded-md hover:bg-red-700"
                >
                    Nạp Tri thức mới
                </button>
            </div>

            {loading && <p>Đang tải...</p>}
            {error && <p className="text-red-500">{error}</p>}

            {!loading && !error && (
                <>
                    <div className="bg-white shadow-md rounded-lg overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Danh mục</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nội dung (trích đoạn)</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nguồn</th>
                                    <th scope="col" className="relative px-6 py-3"><span className="sr-only">Hành động</span></th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {knowledge.map((item) => (
                                    <tr key={item.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.id}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.category}</td>
                                        <td className="px-6 py-4 text-sm text-gray-500 truncate max-w-md">{item.content}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.source_document}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button type="button" onClick={() => handleOpenEditModal(item.id)} className="text-indigo-600 hover:text-indigo-900 mr-4">Sửa</button>
                                            <button type="button" onClick={() => handleDelete(item.id)} className="text-red-600 hover:text-red-900">Xóa</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <Pagination
                        page={pagination.page}
                        pages={pagination.pages}
                        total={pagination.total}
                        onPageChange={handlePageChange}
                    />
                </>
            )}

            {isIngestModalOpen && (
                <KnowledgeIngestModal
                    isOpen={isIngestModalOpen}
                    onClose={handleModalCloseAndRefresh}
                />
            )}

            {isEditModalOpen && selectedKnowledgeId && (
                <KnowledgeEditModal
                    isOpen={isEditModalOpen}
                    onClose={handleModalCloseAndRefresh}
                    knowledgeId={selectedKnowledgeId}
                />
            )}
        </div>
    );
};

export default KnowledgeManagementPage;