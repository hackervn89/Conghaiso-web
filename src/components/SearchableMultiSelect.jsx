import React, { useState, useRef, useEffect } from 'react';

const SearchableMultiSelect = ({ options, value, onChange, placeholder }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const inputRef = useRef(null);

    const selectedOptions = options.filter(opt => value.includes(opt.value));

    const availableOptions = options.filter(opt =>
        !value.includes(opt.value) &&
        opt.label.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSelect = (option) => {
        onChange([...value, option.value]);
        setSearchTerm('');
        setIsOpen(true);
        inputRef.current?.focus();
    };

    const handleRemove = (selectedValue) => {
        onChange(value.filter(v => v !== selectedValue));
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Backspace' && searchTerm === '' && value.length > 0) {
            handleRemove(value[value.length - 1]);
        }
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (inputRef.current && !inputRef.current.parentElement.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);


    return (
        <div className="relative">
            <div 
                className="w-full p-2 border rounded-md bg-white flex flex-wrap items-center gap-2 min-h-[50px]"
                onClick={() => {
                    setIsOpen(true);
                    inputRef.current?.focus();
                }}
            >
                {selectedOptions.map(opt => (
                    <div key={opt.value} className="bg-red-100 text-primaryRed px-2 py-1 rounded-md flex items-center gap-2 text-sm">
                        <span>{opt.label.trim()}</span>
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleRemove(opt.value);
                            }}
                            className="font-bold"
                        >
                            &times;
                        </button>
                    </div>
                ))}
                <input
                    ref={inputRef}
                    type="text"
                    value={searchTerm}
                    onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setIsOpen(true);
                    }}
                    onFocus={() => setIsOpen(true)}
                    onKeyDown={handleKeyDown}
                    placeholder={value.length === 0 ? placeholder : ''}
                    className="flex-1 bg-transparent outline-none p-1"
                />
            </div>
            {isOpen && (
                <ul className="absolute z-10 w-full bg-white border rounded-md mt-1 max-h-48 overflow-y-auto shadow-lg">
                    {availableOptions.length > 0 ? availableOptions.map(option => (
                        <li
                            key={option.value}
                            onMouseDown={() => handleSelect(option)}
                            className="px-4 py-2 hover:bg-red-100 cursor-pointer"
                        >
                            {option.label}
                        </li>
                    )) : <li className="px-4 py-2 text-gray-500">Không tìm thấy hoặc đã được chọn.</li>}
                </ul>
            )}
        </div>
    );
};

export default SearchableMultiSelect;
