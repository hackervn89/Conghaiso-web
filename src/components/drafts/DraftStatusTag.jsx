import React from 'react';

const DraftStatusTag = ({ status }) => {
    const statusStyles = {
        // Trạng thái của người tham gia
        cho_y_kien: { text: 'Chờ ý kiến', bg: 'bg-gray-200', text_color: 'text-gray-800' },
        da_gop_y: { text: 'Đã góp ý', bg: 'bg-blue-200', text_color: 'text-blue-800' },
        da_thong_nhat: { text: 'Đã thống nhất', bg: 'bg-green-200', text_color: 'text-green-800' },

        // Trạng thái chung của dự thảo
        dang_lay_y_kien: { text: 'Đang lấy ý kiến', bg: 'bg-yellow-200', text_color: 'text-yellow-800' },
        qua_han: { text: 'Quá hạn', bg: 'bg-red-200', text_color: 'text-red-800' },
        hoan_thanh: { text: 'Hoàn thành', bg: 'bg-green-200', text_color: 'text-green-800' },
    };

    const style = statusStyles[status] || statusStyles.cho_y_kien;

    return (
        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${style.bg} ${style.text_color}`}>
            {style.text}
        </span>
    );
};

export default DraftStatusTag;