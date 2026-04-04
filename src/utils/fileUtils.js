import apiClient from '../api/client';

export const handleViewFile = async (filePath) => {
    try {
        const response = await apiClient.get(`/files/view?path=${encodeURIComponent(filePath)}`, {
            responseType: 'blob'
        });
        const url = window.URL.createObjectURL(new Blob([response.data], { type: response.headers['content-type'] }));
        window.open(url, '_blank');
        setTimeout(() => window.URL.revokeObjectURL(url), 10000); // Dọn dẹp RAM sau 10s
    } catch (error) {
        console.error('Lỗi khi tải file:', error);
        alert('Không thể mở tài liệu. Bạn không có quyền truy cập hoặc phiên làm việc đã hết hạn.');
    }
};
