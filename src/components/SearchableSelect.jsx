import React, { useState, useEffect } from 'react';

const SearchableSelect = ({ options, value, onChange, placeholder }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [isOpen, setIsOpen] = useState(false);

    const selectedOption = options.find(opt => opt.value === value);

    // Cập nhật lại ô input khi giá trị được chọn thay đổi từ bên ngoài (ví dụ: khi sửa)
    useEffect(() => {
        if (selectedOption) {
            setSearchTerm(selectedOption.label);
        } else {
            setSearchTerm('');
        }
    }, [value, selectedOption]);

    const filteredOptions = options.filter(opt =>
        opt.label.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSelect = (option) => {
        onChange(option.value); // Trả về ID
        setSearchTerm(option.label); // Hiển thị tên
        setIsOpen(false);
    };

    return (
        <div className="relative">
            <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setIsOpen(true);
                    if (e.target.value === '') {
                        onChange(null); // Xóa lựa chọn nếu xóa hết text
                    }
                }}
                onFocus={() => setIsOpen(true)}
                onBlur={() => setTimeout(() => setIsOpen(false), 200)} // Delay để có thể click vào option
                placeholder={placeholder}
                className="w-full p-3 border rounded-md bg-white h-[50px]"
            />
            {isOpen && (
                <ul className="absolute z-10 w-full bg-white border rounded-md mt-1 max-h-48 overflow-y-auto shadow-lg">
                    {filteredOptions.length > 0 ? filteredOptions.map(option => (
                        <li
                            key={option.value}                            
                            onMouseDown={() => handleSelect(option)}
                            className="px-4 py-2 hover:bg-red-100 cursor-pointer"
                        >
                            {option.label}
                        </li>
                    )) : <li className="px-4 py-2 text-gray-500">Không tìm thấy kết quả.</li>}
                </ul>
            )}
        </div>
    );
};

export default SearchableSelect;