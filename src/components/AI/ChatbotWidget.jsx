import React, { useState } from 'react';
import ChatWindow from './ChatWindow';
import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/solid';

const ChatbotWidget = () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            <div className="fixed bottom-4 right-4 z-50">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="bg-primaryRed text-white p-4 rounded-full shadow-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primaryRed"
                    aria-label="Mở cửa sổ chat"
                >
                    <ChatBubbleLeftRightIcon className="h-8 w-8" />
                </button>
            </div>
            <ChatWindow isOpen={isOpen} onClose={() => setIsOpen(false)} />
        </>
    );
};

export default ChatbotWidget;