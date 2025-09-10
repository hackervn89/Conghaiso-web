import React, { useState, useEffect } from 'react';
import apiClient from '../api/client';

const StatItem = ({ label, value, colorClass = 'text-gray-700' }) => (
    <div className="text-center">
        <p className={`text-2xl font-bold ${colorClass}`}>{value}</p>
        <p className="text-sm text-gray-500">{label}</p>
    </div>
);

const AttendanceStats = ({ meetingId }) => {
    const [stats, setStats] = useState({
        totalSummoned: 0,
        totalPresent: 0,
        totalAbsent: 0,
        totalAbsentWithReason: 0,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await apiClient.get(`/meetings/${meetingId}/attendance-stats`);
                setStats(response.data);
            } catch (error) {
                console.error("Không thể tải thống kê điểm danh", error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats(); // Tải lần đầu
        const intervalId = setInterval(fetchStats, 5000); // Cập nhật mỗi 5 giây

        return () => clearInterval(intervalId); // Dọn dẹp khi component bị unmount
    }, [meetingId]);

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
