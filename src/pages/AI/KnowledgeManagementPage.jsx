import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '../../api/client';
import Pagination from '../../components/Pagination';
import KnowledgeIngestModal from '../../components/AI/KnowledgeIngestModal';
import KnowledgeTextIngestModal from '../../components/AI/KnowledgeTextIngestModal';
import KnowledgeEditModal from '../../components/AI/KnowledgeEditModal';

const KnowledgeManagementPage = () => {
    const [knowledge, setKnowledge] = useState([]);
    const [sources, setSources] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
    const [isIngestModalOpen, setIsIngestModalOpen] = useState(false);
    const [isTextIngestModalOpen, setIsTextIngestModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedKnowledgeId, setSelectedKnowledgeId] = useState(null);

    const fetchKnowledge = useCallback(async (page = 1) => {
        setLoading(true);
        try {
            const [knowledgeRes, sourcesRes] = await Promise.all([
                apiClient.get(`/knowledge?page=${page}&limit=15`),
                apiClient.get('/knowledge/sources'),
            ]);

            setKnowledge(knowledgeRes.data.knowledge || []);
            setPagination({
                page: knowledgeRes.data.page || 1,
                pages: knowledgeRes.data.pages || 1,
                total: knowledgeRes.data.total || 0,
            });
            setSources(sourcesRes.data.sources || []);
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
                fetchKnowledge(pagination.page);
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
        const isCreatingNew = isIngestModalOpen || isTextIngestModalOpen;
        setIsIngestModalOpen(false);
        setIsTextIngestModalOpen(false);
        setIsEditModalOpen(false);
        setSelectedKnowledgeId(null);
        fetchKnowledge(isCreatingNew ? 1 : pagination.page);
    };

    return (
        <div className="container mx-auto p-4">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-primaryRed">Quản lý Tri thức AI</h1>
                <div className="flex gap-2">
                    <button
                        onClick={() => setIsTextIngestModalOpen(true)}
                        className="px-4 py-2 font-semibold text-primaryRed bg-white border border-primaryRed rounded-md hover:bg-red-50"
                    >
                        Nhập thủ công
                    </button>
                    <button
                        onClick={() => setIsIngestModalOpen(true)}
                        className="px-4 py-2 font-semibold text-white bg-primaryRed rounded-md hover:bg-red-700"
                    >
                        Nạp từ File
                    </button>
                </div>
            </div>

            {error && <p className="text-red-500 mb-4">{error}</p>}

            <div className="bg-white border border-red-100 rounded-xl p-4 mb-5">
                <h2 className="text-lg font-semibold text-gray-800 mb-3">Nguồn tài liệu đã nạp</h2>
                {sources.length === 0 ? (
                    <p className="text-sm text-gray-500">Chưa có nguồn tài liệu nào.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                            <thead>
                                <tr className="text-left bg-red-50 text-gray-700">
                                    <th className="px-3 py-2">Nguồn tài liệu</th>
                                    <th className="px-3 py-2">Danh mục</th>
                                    <th className="px-3 py-2">Số chunk</th>
                                    <th className="px-3 py-2">Lần nạp gần nhất</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sources.map((s, idx) => (
                                    <tr key={`${s.source_document}-${idx}`} className="border-t">
                                        <td className="px-3 py-2">{s.source_document}</td>
                                        <td className="px-3 py-2">{s.category || 'N/A'}</td>
                                        <td className="px-3 py-2 font-semibold">{s.chunk_count}</td>
                                        <td className="px-3 py-2">{s.last_ingested_at ? new Date(s.last_ingested_at).toLocaleString('vi-VN') : 'N/A'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <div className="bg-white shadow-lg rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full leading-normal">
                        <thead>
                            <tr className="bg-primaryRed text-left text-white uppercase text-sm">
                                <th className="px-5 py-3 border-b-2 border-red-700">ID</th>
                                <th className="px-5 py-3 border-b-2 border-red-700">Danh mục</th>
                                <th className="px-5 py-3 border-b-2 border-red-700">Nội dung (trích đoạn)</th>
                                <th className="px-5 py-3 border-b-2 border-red-700">Nguồn</th>
                                <th className="px-5 py-3 border-b-2 border-red-700 text-center">Hành động</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                Array.from({ length: 5 }).map((_, index) => (
                                    <tr key={index} className="animate-pulse">
                                        <td className="px-5 py-4 border-b border-gray-200"><div className="h-4 bg-gray-200 rounded w-1/4"></div></td>
                                        <td className="px-5 py-4 border-b border-gray-200"><div className="h-4 bg-gray-200 rounded w-1/2"></div></td>
                                        <td className="px-5 py-4 border-b border-gray-200"><div className="h-4 bg-gray-200 rounded w-3/4"></div></td>
                                        <td className="px-5 py-4 border-b border-gray-200"><div className="h-4 bg-gray-200 rounded w-2/3"></div></td>
                                        <td className="px-5 py-4 border-b border-gray-200"><div className="h-8 bg-gray-200 rounded w-full"></div></td>
                                    </tr>
                                ))
                            ) : knowledge.length > 0 ? (
                                knowledge.map((item) => (
                                    <tr key={item.id} className="hover:bg-red-50">
                                        <td className="px-5 py-4 border-b border-red-200 text-sm font-medium text-gray-900">{item.id}</td>
                                        <td className="px-5 py-4 border-b border-red-200 text-sm text-gray-600">{item.category || 'N/A'}</td>
                                        <td className="px-5 py-4 border-b border-red-200 text-sm text-gray-800">
                                            <p className="truncate max-w-md">{item.content}</p>
                                        </td>
                                        <td className="px-5 py-4 border-b border-red-200 text-sm text-gray-600">{item.source_document || 'N/A'}</td>
                                        <td className="px-5 py-4 border-b border-red-200 text-sm text-center">
                                            <button onClick={() => handleOpenEditModal(item.id)} className="text-indigo-600 hover:text-indigo-900 font-medium mr-4">Sửa</button>
                                            <button onClick={() => handleDelete(item.id)} className="text-red-600 hover:text-red-800 font-medium">Xóa</button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="text-center p-10">
                                        <h3 className="text-lg font-semibold text-gray-600">Chưa có mẩu tri thức nào</h3>
                                        <p className="text-gray-500 mt-1">Hãy nạp văn bản cơ quan để bắt đầu.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {!loading && pagination.pages > 1 && (
                    <div className="p-4 border-t border-gray-200">
                        <Pagination
                            currentPage={pagination.page}
                            totalPages={pagination.pages}
                            onPageChange={handlePageChange}
                        />
                    </div>
                )}
            </div>

            {isIngestModalOpen && (
                <KnowledgeIngestModal
                    isOpen={isIngestModalOpen}
                    onClose={handleModalCloseAndRefresh}
                />
            )}

            {isTextIngestModalOpen && (
                <KnowledgeTextIngestModal
                    isOpen={isTextIngestModalOpen}
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
