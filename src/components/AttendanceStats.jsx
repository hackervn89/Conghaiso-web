import React, { useState, useEffect } from 'react';
import apiClient from '../api/client';

const StatItem = ({ label, value, colorClass = 'text-gray-700' }) => (
    <div className="text-center">
        <p className={`text-2xl font-bold ${colorClass}`}>{value}</p>
        <p className="text-sm text-gray-500">{label}</p>
    </div>
);

const AttendanceStats = ({ meetingId, socket }) => {
    const [stats, setStats] = useState({
        totalSummoned: 0,
        totalPresent: 0,
        totalAbsent: 0,
        totalAbsentWithReason: 0,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // 1. Hàm để tải dữ liệu thống kê lần đầu tiên khi component được mount
        const fetchStats = async () => {
            setLoading(true);
            try {
                const response = await apiClient.get(`/meetings/${meetingId}/attendance-stats`);
                setStats(response.data);
                console.log("[AttendanceStats] Tải dữ liệu thống kê ban đầu thành công.");
            } catch (error) {
                console.error("Không thể tải thống kê điểm danh", error);
            } finally {
                setLoading(false);
            }
        };
        
        fetchStats();

        // 2. Nếu có socket, lắng nghe sự kiện cập nhật real-time
        if (socket) {
            const handleStatsUpdate = (newStats) => {
                console.log("%c[Socket] ====> NHẬN ĐƯỢC SỰ KIỆN 'attendance_stats_updated' <====", "color: purple; font-weight: bold;");
                console.log("[AttendanceStats] Dữ liệu thống kê mới nhận được:", newStats);
                setStats(newStats);
            };

            console.log("[AttendanceStats] Đang thiết lập listener cho 'attendance_stats_updated'...");
            socket.on('attendance_stats_updated', handleStatsUpdate);

            // 3. Dọn dẹp: Hủy lắng nghe sự kiện khi component unmount hoặc socket thay đổi
            return () => {
                console.log("[AttendanceStats] Dọn dẹp: Hủy đăng ký listener 'attendance_stats_updated'.");
                socket.off('attendance_stats_updated', handleStatsUpdate);
            };
        }
    }, [meetingId, socket]);

    if (loading) {
        return <div className="p-4 bg-white rounded-lg shadow-md text-center">Đang tải thống kê...</div>;
    }

    const { totalSummoned, totalPresent, totalAbsent, totalAbsentWithReason } = stats;
    const totalChecked = totalPresent + totalAbsent + totalAbsentWithReason;
    const presentPercent = totalSummoned > 0 ? ((totalPresent / totalSummoned) * 100).toFixed(1) : 0;
    const absentPercent = totalSummoned > 0 ? (((totalAbsent + totalAbsentWithReason) / totalSummoned) * 100).toFixed(1) : 0;
    const totalAbsentAll = totalAbsent + totalAbsentWithReason;

    return (
        <div className="bg-white p-4 rounded-lg shadow-md mb-6">
            <h3 className="text-lg font-semibold text-primaryRed mb-4 text-center">Thống kê Điểm danh</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <StatItem label="Triệu tập" value={totalSummoned} />
                <StatItem label="Có mặt" value={totalPresent} colorClass="text-green-600" />
                <StatItem label="Vắng mặt" value={totalAbsentAll} colorClass="text-red-600" />
                <StatItem label="Tỷ lệ" value={`${presentPercent}%`} colorClass="text-blue-600" />
            </div>
             <div className="text-center text-xs text-gray-400 mt-2">
                (Vắng KP: {totalAbsent} | Vắng CP: {totalAbsentWithReason})
            </div>
        </div>
    );
};

export default AttendanceStats;
