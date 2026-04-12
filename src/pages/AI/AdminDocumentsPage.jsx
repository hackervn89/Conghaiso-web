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
        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${className}`}>
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
    const [stats, setStats] = useState({
        total: 0,
        with_file: 0,
        without_file: 0,
        ingested: 0,
        failed: 0,
        processing: 0,
        ocr_done: 0,
        ocr_required: 0,
    });
    const [filterOptions, setFilterOptions] = useState({
        docTypes: [],
        ingestStatuses: ['pending', 'processing', 'ingested', 'failed'],
        ocrStatuses: ['pending', 'required', 'done', 'failed'],
    });
    const [filters, setFilters] = useState({
        search: '',
        docType: '',
        ingestStatus: '',
        ocrStatus: '',
        hasFile: '',
    });
    const [actionState, setActionState] = useState({ loadingCode: null, message: null, error: null });
    const [selectedCodes, setSelectedCodes] = useState([]);
    const [metadataFile, setMetadataFile] = useState(null);
    const [metadataSheets, setMetadataSheets] = useState('Báo cáo,Nghị quyết');
    const [metadataDataRoot, setMetadataDataRoot] = useState('');
    const [importingMetadata, setImportingMetadata] = useState(false);
    const [uploadingCode, setUploadingCode] = useState(null);
    const [statusEditingCode, setStatusEditingCode] = useState(null);
    const [statusDraft, setStatusDraft] = useState({ ocr_status: '', ingest_status: '', last_error: '' });
    const [batchRunning, setBatchRunning] = useState(false);

    const fetchDocuments = useCallback(async (page = 1, currentFilters = filters) => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: String(page),
                limit: '20',
            });

            if (currentFilters.search.trim()) params.set('search', currentFilters.search.trim());
            if (currentFilters.docType.trim()) params.set('docType', currentFilters.docType.trim());
            if (currentFilters.ingestStatus.trim()) params.set('ingestStatus', currentFilters.ingestStatus.trim());
            if (currentFilters.ocrStatus.trim()) params.set('ocrStatus', currentFilters.ocrStatus.trim());
            if (currentFilters.hasFile !== '') params.set('hasFile', currentFilters.hasFile);

            const response = await apiClient.get(`/admin-documents?${params.toString()}`);
            setDocuments(response.data.documents || []);
            setPagination({
                page: response.data.page || 1,
                pages: response.data.pages || 1,
                total: response.data.total || 0,
            });
            setStats(response.data.stats || {});
            setFilterOptions(response.data.filters || {
                docTypes: [],
                ingestStatuses: ['pending', 'processing', 'ingested', 'failed'],
                ocrStatuses: ['pending', 'required', 'done', 'failed'],
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

    const visibleSelectedCount = useMemo(() => documents.filter((doc) => selectedCodes.includes(doc.document_code)).length, [documents, selectedCodes]);

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

    const handleBatchReingest = async () => {
        if (selectedCodes.length === 0) {
            setActionState({ loadingCode: null, message: null, error: 'Hãy chọn ít nhất 1 tài liệu để batch re-ingest.' });
            return;
        }

        if (!window.confirm(`Batch re-ingest ${selectedCodes.length} tài liệu đã chọn?`)) return;

        setBatchRunning(true);
        setActionState({ loadingCode: null, message: null, error: null });
        try {
            const response = await apiClient.post('/admin-documents/reingest-batch', {
                documentCodes: selectedCodes,
            });
            setActionState({
                loadingCode: null,
                message: response.data?.message || 'Batch re-ingest thành công.',
                error: null,
            });
            fetchDocuments(pagination.page, filters);
        } catch (err) {
            setActionState({
                loadingCode: null,
                message: null,
                error: err.response?.data?.message || 'Batch re-ingest thất bại.',
            });
        } finally {
            setBatchRunning(false);
        }
    };

    const handleOpenFile = async (documentCode, fileName) => {
        setActionState({ loadingCode: documentCode, message: null, error: null });
        try {
            const response = await apiClient.get(`/admin-documents/download/${encodeURIComponent(documentCode)}`, {
                responseType: 'blob',
            });

            const blobUrl = window.URL.createObjectURL(new Blob([response.data], {
                type: response.headers['content-type'] || 'application/pdf',
            }));
            const newWindow = window.open(blobUrl, '_blank', 'noopener,noreferrer');
            if (!newWindow) {
                window.location.href = blobUrl;
            }

            window.setTimeout(() => window.URL.revokeObjectURL(blobUrl), 60 * 1000);
            setActionState({ loadingCode: null, message: null, error: null });
        } catch (err) {
            setActionState({
                loadingCode: null,
                message: null,
                error: err.response?.data?.message || `Không thể mở file gốc${fileName ? `: ${fileName}` : '.'}`,
            });
        }
    };

    const handleImportMetadata = async (event) => {
        event.preventDefault();
        if (!metadataFile) {
            setActionState({ loadingCode: null, message: null, error: 'Vui lòng chọn file Excel metadata.' });
            return;
        }

        const formData = new FormData();
        formData.append('metadataFile', metadataFile);
        formData.append('targetSheets', metadataSheets);
        if (metadataDataRoot.trim()) formData.append('dataRoot', metadataDataRoot.trim());

        setImportingMetadata(true);
        setActionState({ loadingCode: null, message: null, error: null });
        try {
            const response = await apiClient.post('/admin-documents/import-metadata', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            const warningText = response.data?.warning ? ` Cảnh báo: ${response.data.warning}` : '';
            setActionState({
                loadingCode: null,
                message: `${response.data?.message || 'Import metadata thành công.'} Imported: ${response.data?.imported || 0}, missing file map: ${response.data?.missingFile || 0}.${warningText}`,
                error: null,
            });
            setMetadataFile(null);
            event.target.reset();
            fetchDocuments(1, filters);
        } catch (err) {
            setActionState({
                loadingCode: null,
                message: null,
                error: err.response?.data?.message || 'Import metadata thất bại.',
            });
        } finally {
            setImportingMetadata(false);
        }
    };

    const handleUploadFile = async (documentCode, file) => {
        if (!file) return;

        const formData = new FormData();
        formData.append('document', file);

        setUploadingCode(documentCode);
        setActionState({ loadingCode: null, message: null, error: null });
        try {
            const response = await apiClient.post(`/admin-documents/upload-file/${encodeURIComponent(documentCode)}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            setActionState({
                loadingCode: null,
                message: response.data?.message || 'Tải file gốc thành công.',
                error: null,
            });
            fetchDocuments(pagination.page, filters);
        } catch (err) {
            setActionState({
                loadingCode: null,
                message: null,
                error: err.response?.data?.message || 'Tải file gốc thất bại.',
            });
        } finally {
            setUploadingCode(null);
        }
    };

    const beginEditStatus = (doc) => {
        setStatusEditingCode(doc.document_code);
        setStatusDraft({
            ocr_status: doc.ocr_status || '',
            ingest_status: doc.ingest_status || '',
            last_error: doc.last_error || '',
        });
    };

    const cancelEditStatus = () => {
        setStatusEditingCode(null);
        setStatusDraft({ ocr_status: '', ingest_status: '', last_error: '' });
    };

    const saveStatus = async (documentCode) => {
        try {
            const payload = {
                ocr_status: statusDraft.ocr_status || null,
                ingest_status: statusDraft.ingest_status || null,
                last_error: statusDraft.last_error,
            };
            const response = await apiClient.patch(`/admin-documents/status/${encodeURIComponent(documentCode)}`, payload);
            setActionState({
                loadingCode: null,
                message: response.data?.message || 'Cập nhật trạng thái thành công.',
                error: null,
            });
            cancelEditStatus();
            fetchDocuments(pagination.page, filters);
        } catch (err) {
            setActionState({
                loadingCode: null,
                message: null,
                error: err.response?.data?.message || 'Cập nhật trạng thái thất bại.',
            });
        }
    };

    const toggleSelect = (documentCode) => {
        setSelectedCodes((prev) => prev.includes(documentCode) ? prev.filter((code) => code !== documentCode) : [...prev, documentCode]);
    };

    const toggleSelectVisible = () => {
        const visibleCodes = documents.map((doc) => doc.document_code);
        const allSelected = visibleCodes.every((code) => selectedCodes.includes(code));

        setSelectedCodes((prev) => {
            if (allSelected) {
                return prev.filter((code) => !visibleCodes.includes(code));
            }
            return [...new Set([...prev, ...visibleCodes])];
        });
    };

    return (
        <div className="container mx-auto p-4 space-y-6">
            <div className="flex flex-col xl:flex-row xl:justify-between xl:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-primaryRed">Quản lý Văn bản Hành chính</h1>
                    <p className="text-gray-600 mt-1">Web-admin hóa pipeline metadata + file gốc + OCR trạng thái + ingest đơn/hàng loạt.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={handleRefresh}
                        className="px-4 py-2 rounded-md bg-white border border-primaryRed text-primaryRed font-semibold hover:bg-red-50"
                    >
                        Làm mới dữ liệu
                    </button>
                    <button
                        onClick={handleBatchReingest}
                        disabled={batchRunning || selectedCodes.length === 0}
                        className="px-4 py-2 rounded-md bg-primaryRed text-white font-semibold hover:bg-red-700 disabled:bg-gray-400"
                    >
                        {batchRunning ? 'Đang batch re-ingest...' : `Re-ingest đã chọn (${selectedCodes.length})`}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                <StatCard title="Tổng metadata" value={stats.total || 0} subtext={`Trang hiện tại: ${documents.length}`} />
                <StatCard title="Có file / thiếu file" value={`${stats.with_file || 0} / ${stats.without_file || 0}`} />
                <StatCard title="Đã ingest / đang xử lý / lỗi" value={`${stats.ingested || 0} / ${stats.processing || 0} / ${stats.failed || 0}`} />
                <StatCard title="OCR done / required" value={`${stats.ocr_done || 0} / ${stats.ocr_required || 0}`} subtext={`${visibleSelectedCount} tài liệu đang được chọn ở trang này`} />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
                <form onSubmit={handleImportMetadata} className="xl:col-span-2 bg-white rounded-xl border border-red-100 p-4 space-y-4">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-800">1. Import metadata từ Excel</h2>
                        <p className="text-sm text-gray-500 mt-1">Cho phép admin import trực tiếp từ web, không cần chạy script server.</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">File Excel metadata</label>
                            <input type="file" accept=".xlsx,.xls" onChange={(e) => setMetadataFile(e.target.files?.[0] || null)} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Sheets cần import</label>
                            <input type="text" value={metadataSheets} onChange={(e) => setMetadataSheets(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md" placeholder="Báo cáo,Nghị quyết" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Data root file gốc (tuỳ chọn)</label>
                            <input type="text" value={metadataDataRoot} onChange={(e) => setMetadataDataRoot(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md" placeholder="/home/.../data/tai_lieu" />
                        </div>
                    </div>
                    <button type="submit" disabled={importingMetadata} className="px-4 py-2 rounded-md bg-primaryRed text-white font-semibold hover:bg-red-700 disabled:bg-gray-400">
                        {importingMetadata ? 'Đang import...' : 'Import metadata'}
                    </button>
                </form>

                <div className="bg-red-50 rounded-xl p-4 border border-red-100">
                    <h2 className="text-lg font-semibold text-primaryRed">2. Pipeline đề xuất</h2>
                    <ol className="list-decimal ml-5 mt-3 text-sm text-gray-700 space-y-2">
                        <li>Import metadata Excel từ web.</li>
                        <li>Map file tự động theo data root hoặc upload file gốc từng tài liệu.</li>
                        <li>Kiểm tra trạng thái OCR tự động sau upload.</li>
                        <li>Re-ingest đơn lẻ hoặc hàng loạt ngay trên web admin.</li>
                        <li>Rà soát lỗi gần nhất và chỉnh trạng thái thủ công nếu cần.</li>
                    </ol>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-red-100 p-4 grid grid-cols-1 md:grid-cols-5 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tìm kiếm</label>
                    <input
                        type="text"
                        value={filters.search}
                        onChange={(e) => handleFilterChange('search', e.target.value)}
                        placeholder="Mã tài liệu, số ký hiệu, trích yếu..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Loại văn bản</label>
                    <select value={filters.docType} onChange={(e) => handleFilterChange('docType', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md">
                        <option value="">Tất cả</option>
                        {(filterOptions.docTypes || []).map((docType) => (
                            <option key={docType} value={docType}>{docType}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ingest status</label>
                    <select value={filters.ingestStatus} onChange={(e) => handleFilterChange('ingestStatus', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md">
                        <option value="">Tất cả</option>
                        {(filterOptions.ingestStatuses || []).map((status) => (
                            <option key={status} value={status}>{formatStatusLabel(status)}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">OCR status</label>
                    <select value={filters.ocrStatus} onChange={(e) => handleFilterChange('ocrStatus', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md">
                        <option value="">Tất cả</option>
                        {(filterOptions.ocrStatuses || []).map((status) => (
                            <option key={status} value={status}>{formatStatusLabel(status)}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái file gốc</label>
                    <select value={filters.hasFile} onChange={(e) => handleFilterChange('hasFile', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md">
                        <option value="">Tất cả</option>
                        <option value="true">Đã có file</option>
                        <option value="false">Chưa có file</option>
                    </select>
                </div>
            </div>

            {actionState.message && <p className="text-green-600">{actionState.message}</p>}
            {actionState.error && <p className="text-red-600">{actionState.error}</p>}
            {error && <p className="text-red-600">{error}</p>}

            <div className="bg-white shadow-lg rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full leading-normal text-sm">
                        <thead>
                            <tr className="bg-primaryRed text-left text-white uppercase text-sm">
                                <th className="px-4 py-3 text-center">
                                    <input type="checkbox" checked={documents.length > 0 && documents.every((doc) => selectedCodes.includes(doc.document_code))} onChange={toggleSelectVisible} />
                                </th>
                                <th className="px-4 py-3">Mã tài liệu</th>
                                <th className="px-4 py-3">Loại</th>
                                <th className="px-4 py-3">Số ký hiệu</th>
                                <th className="px-4 py-3">Trích yếu</th>
                                <th className="px-4 py-3">File gốc</th>
                                <th className="px-4 py-3">OCR</th>
                                <th className="px-4 py-3">Ingest</th>
                                <th className="px-4 py-3 text-center">Hành động</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="9" className="p-6 text-center">Đang tải dữ liệu...</td>
                                </tr>
                            ) : documents.length > 0 ? (
                                documents.map((doc) => (
                                    <React.Fragment key={doc.document_code}>
                                        <tr className="border-t hover:bg-red-50 align-top">
                                            <td className="px-4 py-3 text-center">
                                                <input type="checkbox" checked={selectedCodes.includes(doc.document_code)} onChange={() => toggleSelect(doc.document_code)} />
                                            </td>
                                            <td className="px-4 py-3 font-medium text-gray-900">{doc.document_code}</td>
                                            <td className="px-4 py-3">{doc.doc_type || 'N/A'}</td>
                                            <td className="px-4 py-3">{doc.symbol || 'N/A'}</td>
                                            <td className="px-4 py-3 max-w-md">
                                                <p className="line-clamp-2">{doc.summary || doc.abstract || 'Chưa có trích yếu'}</p>
                                                <p className="text-xs text-gray-500 mt-1">{doc.issued_date ? new Date(doc.issued_date).toLocaleDateString('vi-VN') : 'N/A'} · {doc.issuer || 'Chưa rõ cơ quan'}</p>
                                            </td>
                                            <td className="px-4 py-3 min-w-[220px]">
                                                {doc.file_name ? (
                                                    <div className="space-y-2">
                                                        <p className="text-xs text-gray-700 break-all">{doc.file_name}</p>
                                                        <button
                                                            onClick={() => handleOpenFile(doc.document_code, doc.file_name)}
                                                            disabled={actionState.loadingCode === doc.document_code}
                                                            className="px-3 py-1 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-400"
                                                        >
                                                            {actionState.loadingCode === doc.document_code ? 'Đang mở...' : 'Xem gốc'}
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="space-y-2">
                                                        <p className="text-xs text-orange-700">Chưa có file gốc</p>
                                                    </div>
                                                )}
                                                <label className="mt-2 inline-block text-xs px-3 py-1 rounded-md bg-gray-100 hover:bg-gray-200 cursor-pointer">
                                                    {uploadingCode === doc.document_code ? 'Đang upload...' : 'Tải file gốc'}
                                                    <input
                                                        type="file"
                                                        className="hidden"
                                                        accept=".pdf,.docx,.txt"
                                                        onChange={(e) => {
                                                            const file = e.target.files?.[0];
                                                            if (file) handleUploadFile(doc.document_code, file);
                                                            e.target.value = '';
                                                        }}
                                                    />
                                                </label>
                                            </td>
                                            <td className="px-4 py-3"><StatusBadge value={doc.ocr_status || 'pending'} stylesMap={OCR_STATUS_STYLES} /></td>
                                            <td className="px-4 py-3"><StatusBadge value={doc.ingest_status || 'pending'} stylesMap={STATUS_STYLES} /></td>
                                            <td className="px-4 py-3 text-center space-y-2 min-w-[180px]">
                                                <button
                                                    onClick={() => handleReingest(doc.document_code)}
                                                    disabled={actionState.loadingCode === doc.document_code}
                                                    className="w-full px-3 py-1 rounded-md bg-primaryRed text-white hover:bg-red-700 disabled:bg-gray-400"
                                                >
                                                    {actionState.loadingCode === doc.document_code ? 'Đang nạp...' : 'Re-ingest'}
                                                </button>
                                                {statusEditingCode === doc.document_code ? (
                                                    <div className="space-y-2 text-left bg-gray-50 p-2 rounded-md">
                                                        <select value={statusDraft.ocr_status} onChange={(e) => setStatusDraft((prev) => ({ ...prev, ocr_status: e.target.value }))} className="w-full px-2 py-1 border border-gray-300 rounded-md text-xs">
                                                            <option value="">OCR giữ nguyên</option>
                                                            {(filterOptions.ocrStatuses || []).map((status) => <option key={status} value={status}>{formatStatusLabel(status)}</option>)}
                                                        </select>
                                                        <select value={statusDraft.ingest_status} onChange={(e) => setStatusDraft((prev) => ({ ...prev, ingest_status: e.target.value }))} className="w-full px-2 py-1 border border-gray-300 rounded-md text-xs">
                                                            <option value="">Ingest giữ nguyên</option>
                                                            {(filterOptions.ingestStatuses || []).map((status) => <option key={status} value={status}>{formatStatusLabel(status)}</option>)}
                                                        </select>
                                                        <textarea value={statusDraft.last_error} onChange={(e) => setStatusDraft((prev) => ({ ...prev, last_error: e.target.value }))} rows="2" className="w-full px-2 py-1 border border-gray-300 rounded-md text-xs" placeholder="Lỗi gần nhất / ghi chú" />
                                                        <div className="flex gap-2">
                                                            <button onClick={() => saveStatus(doc.document_code)} className="flex-1 px-2 py-1 rounded-md bg-green-600 text-white text-xs">Lưu</button>
                                                            <button onClick={cancelEditStatus} className="flex-1 px-2 py-1 rounded-md bg-gray-300 text-gray-800 text-xs">Huỷ</button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <button onClick={() => beginEditStatus(doc)} className="w-full px-3 py-1 rounded-md bg-white border border-gray-300 text-gray-700 hover:bg-gray-50">
                                                        Sửa trạng thái
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                        {doc.last_error && (
                                            <tr className="bg-red-50 border-t">
                                                <td colSpan="9" className="px-4 py-2 text-xs text-red-700">
                                                    <b>Lỗi gần nhất:</b> {doc.last_error}
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="9" className="p-10 text-center text-gray-500">Chưa có metadata tài liệu nào được import.</td>
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
