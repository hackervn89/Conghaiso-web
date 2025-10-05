import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import apiClient from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import DraftStatusTag from '../../components/drafts/DraftStatusTag';
import CommentModal from '../../components/drafts/CommentModal';
import { ArrowLeftIcon, PaperClipIcon, ChatBubbleLeftEllipsisIcon, CheckCircleIcon, UserCircleIcon, ClockIcon, TagIcon, InformationCircleIcon, UserGroupIcon } from '@heroicons/react/24/outline';

// Component Card nội bộ để tái sử dụng
const Card = ({ title, icon, children }) => (
    <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold text-primaryRed border-b border-red-200 pb-3 mb-4 flex items-center">{icon} <span className="ml-2">{title}</span></h2>
        {children}
    </div>
);

const DraftDetailPage = () => {
    const { draftId } = useParams();
    const { user } = useAuth();
    const [draft, setDraft] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);

    const fetchDraftDetail = useCallback(async () => {
        try {
            setLoading(true);
            const response = await apiClient.get(`/drafts/${draftId}`);
            setDraft(response.data);
            setError(null);
        } catch (err) {
            setError('Không thể tải chi tiết dự thảo hoặc bạn không có quyền truy cập.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [draftId]);

    useEffect(() => {
        fetchDraftDetail();
    }, [fetchDraftDetail]);

    const handleAgree = async () => {
        if (window.confirm('Bạn có chắc chắn muốn "Thống nhất" với nội dung dự thảo này? Hành động này không thể hoàn tác.')) {
            try {
                await apiClient.post(`/drafts/${draftId}/agree`);
                alert('Xác nhận thống nhất thành công!');
                fetchDraftDetail(); // Tải lại dữ liệu
            } catch (err) {
                alert(err.response?.data?.message || 'Có lỗi xảy ra khi xác nhận thống nhất.');
            }
        }
    };

    const handleCommentSubmitted = () => {
        setIsCommentModalOpen(false);
        fetchDraftDetail(); // Tải lại dữ liệu
    };

    const handleOpenFile = (filePath) => {
        if (!filePath) return;
        const fileUrl = `${apiClient.defaults.baseURL}/files/view?path=${encodeURIComponent(filePath)}`;
        window.open(fileUrl, '_blank');
    };

    const formatDateTime = (isoString) => {
        if (!isoString) return 'N/A';
        return new Date(isoString).toLocaleString('vi-VN');
    };

    if (loading) return <div className="p-6">Đang tải chi tiết dự thảo...</div>;
    if (error) return <div className="p-6 text-red-500">{error}</div>;
    if (!draft) return <div className="p-6">Không tìm thấy thông tin dự thảo.</div>;

    const currentUserParticipant = draft.participants.find(p => p.user_id === user.userId);
    const canTakeAction = currentUserParticipant && currentUserParticipant.status === 'cho_y_kien';
    
    // Ưu tiên sử dụng mảng attachments mới, nếu không có thì dùng trường cũ để tương thích ngược
    const attachments = draft.attachments && draft.attachments.length > 0 ? draft.attachments : [{ file_name: draft.file_name, file_path: draft.file_path }];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-primaryRed">{draft.title}</h1>
                <Link to="/du-thao" className="flex items-center px-4 py-2 font-semibold text-white bg-primaryRed rounded-md hover:bg-red-700">
                    <ArrowLeftIcon className="h-5 w-5 mr-2" /> Quay lại
                </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Cột trái: Thông tin & Hành động */}
                <div className="lg:col-span-1 space-y-6">
                    <Card title="Thông tin chung" icon={<InformationCircleIcon className="h-6 w-6" />}>
                        <ul className="space-y-3 text-gray-700">
                            <li className="flex items-center"><UserCircleIcon className="h-5 w-5 mr-3 text-gray-400" /> <strong>Người tạo:</strong><span className="ml-2">{draft.creator_name}</span></li>
                            <li className="flex items-center"><ClockIcon className="h-5 w-5 mr-3 text-gray-400" /> <strong>Hạn chót:</strong><span className="ml-2">{formatDateTime(draft.deadline)}</span></li>
                            <li className="flex items-center"><TagIcon className="h-5 w-5 mr-3 text-gray-400" /> <strong>Trạng thái:</strong><span className="ml-2"><DraftStatusTag status={draft.status} /></span></li>
                        </ul>
                        <div className="mt-6 space-y-2">
                            <h4 className="text-sm font-semibold text-gray-600">Tài liệu đính kèm:</h4>
                            {attachments.map((file, index) => (
                                file.file_path && <button key={index} onClick={() => handleOpenFile(file.file_path)} className="w-full flex items-center justify-start text-left px-3 py-2 font-medium text-blue-700 bg-blue-50 rounded-md hover:bg-blue-100">
                                    <PaperClipIcon className="h-5 w-5 mr-2 flex-shrink-0" />
                                    <span className="truncate">{file.file_name}</span>
                                </button>
                            ))}
                        </div>
                        {canTakeAction && (
                            <div className="mt-4 grid grid-cols-2 gap-3">
                                <button onClick={() => setIsCommentModalOpen(true)} className="flex items-center justify-center px-4 py-2 font-semibold text-white bg-yellow-500 rounded-md hover:bg-yellow-600">
                                    <ChatBubbleLeftEllipsisIcon className="h-5 w-5 mr-2" />
                                    Góp ý
                                </button>
                                <button onClick={handleAgree} className="flex items-center justify-center px-4 py-2 font-semibold text-white bg-green-600 rounded-md hover:bg-green-700">
                                    <CheckCircleIcon className="h-5 w-5 mr-2" />
                                    Thống nhất
                                </button>
                            </div>
                        )}
                    </Card>

                    <Card title="Danh sách lấy ý kiến" icon={<UserGroupIcon className="h-6 w-6" />}>
                        <div className="space-y-3 max-h-96 overflow-y-auto">
                            {draft.participants.map(p => (
                                <div key={p.user_id} className="p-3 bg-gray-50 rounded-md flex justify-between items-center border border-gray-200">
                                    <div>
                                        <p className="font-medium text-gray-800">{p.full_name}</p>
                                        {p.response_at && <p className="text-xs text-gray-500">Lúc: {formatDateTime(p.response_at)}</p>}
                                    </div>
                                    <DraftStatusTag status={p.status} />
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>

                {/* Cột phải: Ý kiến góp ý */}
                <div className="lg:col-span-2">
                    <Card title="Ý kiến góp ý" icon={<ChatBubbleLeftEllipsisIcon className="h-6 w-6" />}>
                        {draft.comments.length > 0 ? (
                            <div className="space-y-4 max-h-[40rem] overflow-y-auto">
                                {draft.comments.map((comment, index) => (
                                    <div key={index} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                                        <div className="flex justify-between items-center mb-2">
                                            <p className="font-semibold text-gray-900">{comment.full_name}</p>
                                            <p className="text-xs text-gray-500">{formatDateTime(comment.created_at)}</p>
                                        </div>
                                        <p className="text-gray-700 whitespace-pre-wrap">{comment.comment}</p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-10 text-gray-500">
                                {draft.creator_id === user.userId || user.role === 'Admin' || user.role === 'Secretary'
                                    ? 'Chưa có ý kiến góp ý nào.'
                                    : 'Bạn không có quyền xem các ý kiến góp ý.'}
                            </div>
                        )}
                    </Card>
                </div>
            </div>
            <CommentModal
                isOpen={isCommentModalOpen}
                onClose={() => setIsCommentModalOpen(false)}
                draftId={draftId}
                onCommentSubmitted={handleCommentSubmitted}
            />
        </div>
    );
};

export default DraftDetailPage;