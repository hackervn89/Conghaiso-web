import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '../../api/client';
import Pagination from '../../components/Pagination';
import AnchorKeywordFormModal from '../../components/AI/AnchorKeywordFormModal';
import { MagnifyingGlassIcon, TagIcon } from '@heroicons/react/24/outline';

const AnchorKeywordManagementPage = () => {
    const [keywords, setKeywords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalItems: 0 });
    const [searchTerm, setSearchTerm] = useState('');

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedKeyword, setSelectedKeyword] = useState(null);

    const fetchKeywords = useCallback(async (page = 1, search = '') => {
        setLoading(true);
        try {
            const params = {
                page,
                limit: 15,
                searchTerm: search || null,
            };
            const response = await apiClient.get('/anchor-keywords', { params });
            setKeywords(response.data.keywords || []);
            setPagination({
                currentPage: response.data.currentPage || 1,
                totalPages: response.data.totalPages || 1,
                totalItems: response.data.totalItems || 0,
            });
            setError(null);
        } catch (err) {
            setError('Không thể tải danh sách từ khóa.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const handler = setTimeout(() => {
            fetchKeywords(pagination.currentPage, searchTerm);
        }, 300); // Debounce search input

        return () => {
            clearTimeout(handler);
        };
    }, [pagination.currentPage, searchTerm, fetchKeywords]);

    const handlePageChange = (newPage) => {
        setPagination(prev => ({ ...prev, currentPage: newPage }));
    };

    const handleOpenModal = (keyword = null) => {
        setSelectedKeyword(keyword);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setSelectedKeyword(null);
        setIsModalOpen(false);
    };

    const handleSaveSuccess = () => {
        handleCloseModal();
        // Tải lại trang hiện tại để cập nhật dữ liệu
        fetchKeywords(pagination.currentPage, searchTerm);
    };

    const handleDelete = async (id, keyword) => {
        if (window.confirm(`Bạn có chắc chắn muốn xóa từ khóa "${keyword}" không?`)) {
            try {
                await apiClient.delete(`/anchor-keywords/${id}`);
                alert('Xóa từ khóa thành công!');
                // Tải lại dữ liệu sau khi xóa
                fetchKeywords(pagination.currentPage, searchTerm);
            } catch (err) {
                alert(err.response?.data?.message || 'Xóa từ khóa thất bại.');
                console.error(err);
            }
        }
    };

    const formatDateTime = (isoString) => {
        if (!isoString) return 'N/A';
        return new Date(isoString).toLocaleString('vi-VN');
    };

    return (
        <div className="container mx-auto p-4">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-primaryRed">Quản lý Từ khóa Neo (AI)</h1>
                <button
                    onClick={() => handleOpenModal()}
                    className="px-4 py-2 font-semibold text-white bg-primaryRed rounded-md hover:bg-red-700"
                >
                    Thêm Từ khóa mới
                </button>
            </div>

            <div className="bg-white shadow-lg rounded-xl overflow-hidden">
                <div className="p-6">
                    <div className="relative w-full md:w-1/3">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Tìm theo từ khóa hoặc loại..."
                            value={searchTerm}
                            onChange={e => {
                                setSearchTerm(e.target.value);
                                handlePageChange(1); // Reset về trang 1 khi tìm kiếm
                            }}
                            className="p-2 pl-10 border rounded-md w-full focus:ring-primaryRed focus:border-primaryRed"
                        />
                    </div>
                </div>

                {error && <p className="text-red-500 p-6">{error}</p>}

                <div className="overflow-x-auto">
                    <table className="min-w-full leading-normal">
                        <thead>
                            <tr className="bg-primaryRed text-left text-white uppercase text-sm">
                                <th className="px-5 py-3 border-b-2 border-red-700">ID</th>
                                <th className="px-5 py-3 border-b-2 border-red-700">Từ khóa</th>
                                <th className="px-5 py-3 border-b-2 border-red-700">Loại</th>
                                <th className="px-5 py-3 border-b-2 border-red-700">Ngày tạo</th>
                                <th className="px-5 py-3 border-b-2 border-red-700 text-center">Hành động</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                Array.from({ length: 5 }).map((_, index) => (
                                    <tr key={index} className="animate-pulse">
                                        <td className="px-5 py-4 border-b border-gray-200"><div className="h-4 bg-gray-200 rounded w-1/4"></div></td>
                                        <td className="px-5 py-4 border-b border-gray-200"><div className="h-4 bg-gray-200 rounded w-3/4"></div></td>
                                        <td className="px-5 py-4 border-b border-gray-200"><div className="h-4 bg-gray-200 rounded w-1/2"></div></td>
                                        <td className="px-5 py-4 border-b border-gray-200"><div className="h-4 bg-gray-200 rounded w-2/3"></div></td>
                                        <td className="px-5 py-4 border-b border-gray-200"><div className="h-8 bg-gray-200 rounded w-full"></div></td>
                                    </tr>
                                ))
                            ) : keywords.length > 0 ? (
                                keywords.map((kw) => (
                                    <tr key={kw.id} className="hover:bg-red-50">
                                        <td className="px-5 py-4 border-b border-red-200 text-sm font-medium text-gray-900">{kw.id}</td>
                                        <td className="px-5 py-4 border-b border-red-200 text-sm font-semibold">{kw.keyword}</td>
                                        <td className="px-5 py-4 border-b border-red-200 text-sm">
                                            {kw.type && (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                                    <TagIcon className="h-4 w-4 mr-1.5" />
                                                    {kw.type}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-5 py-4 border-b border-red-200 text-sm text-gray-600">{formatDateTime(kw.created_at)}</td>
                                        <td className="px-5 py-4 border-b border-red-200 text-sm text-center">
                                            <button onClick={() => handleOpenModal(kw)} className="text-indigo-600 hover:text-indigo-900 font-medium mr-4">Sửa</button>
                                            <button onClick={() => handleDelete(kw.id, kw.keyword)} className="text-red-600 hover:text-red-800 font-medium">Xóa</button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="text-center p-10">
                                        <h3 className="text-lg font-semibold text-gray-600">Không tìm thấy từ khóa nào</h3>
                                        <p className="text-gray-500 mt-1">Hãy thử thay đổi bộ lọc hoặc thêm một từ khóa mới.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {!loading && pagination.totalPages > 1 && (
                    <div className="p-4 border-t border-gray-200">
                        <Pagination
                            currentPage={pagination.currentPage}
                            totalPages={pagination.totalPages}
                            onPageChange={handlePageChange}
                        />
                    </div>
                )}
            </div>

            {isModalOpen && (
                <AnchorKeywordFormModal
                    isOpen={isModalOpen}
                    onClose={handleCloseModal}
                    onSave={handleSaveSuccess}
                    initialData={selectedKeyword}
                />
            )}
        </div>
    );
};

export default AnchorKeywordManagementPage;