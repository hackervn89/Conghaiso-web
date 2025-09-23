import React from 'react';

const generateTimeOptions = () => {
    const times = [];
    for (let h = 6; h <= 18; h++) { // Start from 06:00, end at 18:00
        for (let m = 0; m < 60; m += 15) {
            // Only include times up to 18:00
            if (h === 18 && m > 0) continue;
            const hour = h.toString().padStart(2, '0');
            const minute = m.toString().padStart(2, '0');
            times.push(`${hour}:${minute}`);
        }
    }
    return times;
};

const timeOptions = generateTimeOptions();

const TimePicker = ({ value, onChange, className = "" }) => {
    return (
        <select
            className={`w-full p-3 border rounded-md bg-white h-[50px] ${className}`}
        >
            <option value="">Chọn giờ...</option>
            {timeOptions.map((time) => (
                <option key={time} value={time}>
                    {time}
                </option>
            ))}
        </select>
    );
};

export default TimePicker;
