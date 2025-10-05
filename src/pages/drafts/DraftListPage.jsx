import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../../api/client';
import CreateDraftModal from '../../components/drafts/CreateDraftModal';
import DraftStatusTag from '../../components/drafts/DraftStatusTag';
import { PlusIcon } from '@heroicons/react/24/solid';

const DraftListPage = () => {
    const [drafts, setDrafts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const fetchDrafts = useCallback(async () => {
        try {
            setLoading(true);
            const response = await apiClient.get('/drafts');
            setDrafts(response.data);
            setError(null);
        } catch (err) {
            setError('Không thể tải danh sách dự thảo. Vui lòng thử lại.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchDrafts();
    }, [fetchDrafts]);

    const handleDraftCreated = () => {
        setIsModalOpen(false);
        fetchDrafts(); // Tải lại danh sách sau khi tạo mới
    };

    const formatDateTime = (isoString) => {
        if (!isoString) return 'N/A';
        return new Date(isoString).toLocaleString('vi-VN');
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                <h1 className="text-3xl font-bold text-primaryRed">QUẢN LÝ GÓP Ý DỰ THẢO VĂN BẢN</h1>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center px-4 py-2 font-bold text-white bg-primaryRed rounded-md hover:bg-red-700"
                >
                    <PlusIcon className="h-5 w-5 mr-2" />
                    Tạo Góp ý mới
                </button>
            </div>

            {loading && <p>Đang tải danh sách...</p>}
            {error && <p className="text-red-500">{error}</p>}

            {!loading && !error && (
                <div className="bg-white shadow-md rounded-lg overflow-x-auto">
                    <table className="min-w-full leading-normal">
                        <thead>
                            <tr>
                                <th className="px-5 py-3 border-b-2 border-red-700 bg-primaryRed text-left text-xs font-semibold text-white uppercase tracking-wider">Tiêu đề</th>
                                <th className="px-5 py-3 border-b-2 border-red-700 bg-primaryRed text-left text-xs font-semibold text-white uppercase tracking-wider">Người tạo</th>
                                <th className="px-5 py-3 border-b-2 border-red-700 bg-primaryRed text-left text-xs font-semibold text-white uppercase tracking-wider">Hạn chót</th>
                                <th className="px-5 py-3 border-b-2 border-red-700 bg-primaryRed text-left text-xs font-semibold text-white uppercase tracking-wider">Trạng thái của bạn</th>
                                <th className="px-5 py-3 border-b-2 border-red-700 bg-primaryRed text-left text-xs font-semibold text-white uppercase tracking-wider">Trạng thái chung</th>
                            </tr>
                        </thead>
                        <tbody>
                            {drafts.length > 0 ? drafts.map((draft) => (
                                <tr key={draft.id} className="hover:bg-red-50">
                                    <td className="px-5 py-4 border-b border-red-200 text-sm">
                                        <Link to={`/du-thao/${draft.id}`} className="text-primaryRed font-medium hover:underline">
                                            {draft.title}
                                        </Link>
                                    </td>
                                    <td className="px-5 py-4 border-b border-red-200 text-sm text-gray-700">{draft.creator_name}</td>
                                    <td className="px-5 py-4 border-b border-red-200 text-sm text-gray-700">{formatDateTime(draft.deadline)}</td>
                                    <td className="px-5 py-4 border-b border-red-200 text-sm">
                                        <DraftStatusTag status={draft.participant_status} />
                                    </td>
                                    <td className="px-5 py-4 border-b border-red-200 text-sm">
                                        <DraftStatusTag status={draft.status} />
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="5" className="px-6 py-4 text-center text-gray-500">Không có dự thảo nào.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            <CreateDraftModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onDraftCreated={handleDraftCreated} />
        </div>
    );
};

export default DraftListPage;