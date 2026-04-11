import React, { useCallback, useEffect, useMemo, useState } from 'react';
import apiClient from '../../api/client';
import Pagination from '../../components/Pagination';

const STATUS_STYLES = {
    pending: 'bg-yellow-100 text-yellow-800',
    processing: 'bg-blue-100 text-blue-800',
    ingested: 'bg-green-100 text-green-800',
    failed: 'bg-red-100 text-red-800',
};

const OCR_STATUS_STYLES = {
    pending: 'bg-gray-100 text-gray-700',
    required: 'bg-orange-100 text-orange-800',
    done: 'bg-green-100 text-green-800',
    failed: 'bg-red-100 text-red-800',
};

const formatStatusLabel = (value) => {
    if (!value) return 'pending';
    return value.replace(/_/g, ' ');
};

const StatusBadge = ({ value, stylesMap }) => {
    const className = stylesMap[value] || 'bg-gray-100 text-gray-700';
    return (
        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${className}`}>
            {formatStatusLabel(value)}
        </span>
    );
};

const StatCard = ({ title, value, subtext }) => (
    <div className="bg-white border border-red-100 rounded-xl p-4 shadow-sm">
        <p className="text-sm text-gray-500">{title}</p>
        <p className="text-2xl font-bold text-primaryRed mt-1">{value}</p>
        {subtext && <p className="text-xs text-gray-500 mt-1">{subtext}</p>}
    </div>
);

const AdminDocumentsPage = () => {
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
    const [filters, setFilters] = useState({ search: '', docType: '' });
    const [actionState, setActionState] = useState({ loadingCode: null, message: null, error: null });

    const fetchDocuments = useCallback(async (page = 1, currentFilters = filters) => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: String(page),
                limit: '20',
            });

            if (currentFilters.search.trim()) params.set('search', currentFilters.search.trim());
            if (currentFilters.docType.trim()) params.set('docType', currentFilters.docType.trim());

            const response = await apiClient.get(`/admin-documents?${params.toString()}`);
            setDocuments(response.data.documents || []);
            setPagination({
                page: response.data.page || 1,
                pages: response.data.pages || 1,
                total: response.data.total || 0,
            });
            setError(null);
        } catch (err) {
            setError('Không thể tải danh sách tài liệu hành chính.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        fetchDocuments(1, filters);
    }, [fetchDocuments, filters]);

    const stats = useMemo(() => {
        const reportCount = documents.filter((doc) => doc.doc_type === 'Báo cáo').length;
        const resolutionCount = documents.filter((doc) => doc.doc_type === 'Nghị quyết').length;
        const ingestedCount = documents.filter((doc) => doc.ingest_status === 'ingested').length;
        const failedCount = documents.filter((doc) => doc.ingest_status === 'failed').length;

        return {
            reportCount,
            resolutionCount,
            ingestedCount,
            failedCount,
        };
    }, [documents]);

    const handleFilterChange = (field, value) => {
        setFilters((prev) => ({ ...prev, [field]: value }));
    };

    const handleRefresh = () => {
        fetchDocuments(pagination.page, filters);
    };

    const handleReingest = async (documentCode) => {
        if (!window.confirm(`Nạp lại tri thức cho tài liệu ${documentCode}?`)) return;

        setActionState({ loadingCode: documentCode, message: null, error: null });
        try {
            const response = await apiClient.post(`/admin-documents/reingest/${encodeURIComponent(documentCode)}`);
            setActionState({
                loadingCode: null,
                message: response.data?.message || 'Nạp lại tri thức thành công.',
                error: null,
            });
            fetchDocuments(pagination.page, filters);
        } catch (err) {
            setActionState({
                loadingCode: null,
                message: null,
                error: err.response?.data?.message || 'Nạp lại tri thức thất bại.',
            });
        }
    };

    const handleOpenFile = (documentCode) => {
        window.open(`/api/admin-documents/download/${encodeURIComponent(documentCode)}`, '_blank');
    };

    return (
        <div className="container mx-auto p-4">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-primaryRed">Quản lý Văn bản Hành chính</h1>
                    <p className="text-gray-600 mt-1">Quản lý metadata tài liệu, mở file gốc và nạp lại tri thức theo từng văn bản.</p>
                </div>
                <button
                    onClick={handleRefresh}
                    className="px-4 py-2 rounded-md bg-white border border-primaryRed text-primaryRed font-semibold hover:bg-red-50"
                >
                    Làm mới dữ liệu
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-5">
                <StatCard title="Tổng tài liệu trang hiện tại" value={documents.length} subtext={`Tổng bản ghi: ${pagination.total}`} />
                <StatCard title="Báo cáo" value={stats.reportCount} />
                <StatCard title="Nghị quyết" value={stats.resolutionCount} />
                <StatCard title="Đã ingest / lỗi" value={`${stats.ingestedCount} / ${stats.failedCount}`} />
            </div>

            <div className="bg-white rounded-xl border border-red-100 p-4 mb-5 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tìm kiếm</label>
                    <input
                        type="text"
                        value={filters.search}
                        onChange={(e) => handleFilterChange('search', e.target.value)}
                        placeholder="Mã tài liệu, số ký hiệu, tên file, trích yếu..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Loại văn bản</label>
                    <select
                        value={filters.docType}
                        onChange={(e) => handleFilterChange('docType', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                        <option value="">Tất cả</option>
                        <option value="Báo cáo">Báo cáo</option>
                        <option value="Nghị quyết">Nghị quyết</option>
                    </select>
                </div>
                <div className="bg-red-50 rounded-lg p-3 text-sm text-gray-700">
                    <p className="font-semibold text-primaryRed mb-1">Quy trình test đề xuất</p>
                    <ol className="list-decimal ml-4 space-y-1">
                        <li>Import metadata bằng script backend</li>
                        <li>Kiểm tra file gốc bằng nút <b>Xem gốc</b></li>
                        <li>Bấm <b>Re-ingest</b> để sinh tri thức cho từng văn bản</li>
                    </ol>
                </div>
            </div>

            {actionState.message && <p className="mb-4 text-green-600">{actionState.message}</p>}
            {actionState.error && <p className="mb-4 text-red-600">{actionState.error}</p>}
            {error && <p className="mb-4 text-red-600">{error}</p>}

            <div className="bg-white shadow-lg rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full leading-normal text-sm">
                        <thead>
                            <tr className="bg-primaryRed text-left text-white uppercase text-sm">
                                <th className="px-4 py-3">Mã tài liệu</th>
                                <th className="px-4 py-3">Loại</th>
                                <th className="px-4 py-3">Số ký hiệu</th>
                                <th className="px-4 py-3">Trích yếu</th>
                                <th className="px-4 py-3">Ngày BH</th>
                                <th className="px-4 py-3">OCR</th>
                                <th className="px-4 py-3">Ingest</th>
                                <th className="px-4 py-3 text-center">Hành động</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="8" className="p-6 text-center">Đang tải dữ liệu...</td>
                                </tr>
                            ) : documents.length > 0 ? (
                                documents.map((doc) => (
                                    <React.Fragment key={doc.document_code}>
                                        <tr className="border-t hover:bg-red-50 align-top">
                                            <td className="px-4 py-3 font-medium text-gray-900">{doc.document_code}</td>
                                            <td className="px-4 py-3">{doc.doc_type || 'N/A'}</td>
                                            <td className="px-4 py-3">{doc.symbol || 'N/A'}</td>
                                            <td className="px-4 py-3 max-w-md">
                                                <p className="line-clamp-2">{doc.summary || doc.abstract || 'Chưa có trích yếu'}</p>
                                            </td>
                                            <td className="px-4 py-3">{doc.issued_date ? new Date(doc.issued_date).toLocaleDateString('vi-VN') : 'N/A'}</td>
                                            <td className="px-4 py-3"><StatusBadge value={doc.ocr_status || 'pending'} stylesMap={OCR_STATUS_STYLES} /></td>
                                            <td className="px-4 py-3"><StatusBadge value={doc.ingest_status || 'pending'} stylesMap={STATUS_STYLES} /></td>
                                            <td className="px-4 py-3 text-center space-y-2">
                                                <button
                                                    onClick={() => handleOpenFile(doc.document_code)}
                                                    className="w-full px-3 py-1 rounded-md bg-blue-600 text-white hover:bg-blue-700"
                                                >
                                                    Xem gốc
                                                </button>
                                                <button
                                                    onClick={() => handleReingest(doc.document_code)}
                                                    disabled={actionState.loadingCode === doc.document_code}
                                                    className="w-full px-3 py-1 rounded-md bg-primaryRed text-white hover:bg-red-700 disabled:bg-gray-400"
                                                >
                                                    {actionState.loadingCode === doc.document_code ? 'Đang nạp...' : 'Re-ingest'}
                                                </button>
                                            </td>
                                        </tr>
                                        {doc.last_error && (
                                            <tr className="bg-red-50 border-t">
                                                <td colSpan="8" className="px-4 py-2 text-xs text-red-700">
                                                    <b>Lỗi gần nhất:</b> {doc.last_error}
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="8" className="p-10 text-center text-gray-500">Chưa có metadata tài liệu nào được import.</td>
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
                            onPageChange={(page) => fetchDocuments(page, filters)}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminDocumentsPage;
