import React, { useState, useRef, useEffect } from 'react';
import apiClient from '../../api/client';
import logoImage from '../../assets/logo.png'; // Import logo
import { PaperAirplaneIcon } from '@heroicons/react/24/solid';

const AiChatPage = () => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [messages, isLoading]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (input.trim() === '' || isLoading) return;

        const userMessage = { sender: 'user', text: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const response = await apiClient.post('/chat', { prompt: input });
            const aiMessage = { sender: 'ai', text: response.data.reply };
            setMessages(prev => [...prev, aiMessage]);
        } catch (error) {
            const errorMessage = { sender: 'ai', text: 'Xin lỗi, đã có lỗi xảy ra khi kết nối với Trợ lý AI. Vui lòng thử lại.' };
            setMessages(prev => [...prev, errorMessage]);
            console.error("Chat API error:", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-gray-100"> {/* Đảm bảo component cha chiếm toàn bộ chiều cao */}
            <div className="max-w-4xl mx-auto w-full flex-1 flex flex-col"> {/* Thêm flex-1 để container này giãn ra */}
                {/* Message List */}
                <div className="flex-1 overflow-y-auto p-4 md:p-8" id="message-list">
                    <div className="space-y-6">
                        {messages.length === 0 && !isLoading && (
                            <div className="text-center py-10">
                                <h1 className="text-2xl font-bold text-primaryRed mb-2">Trợ lý AI Công Hải Số</h1>
                                <p className="text-gray-600">Tôi có thể giúp gì cho bạn hôm nay?</p>
                            </div>
                        )}

                        {messages.map((msg, index) => (
                            <div key={index} className={`flex gap-4 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                {msg.sender === 'ai' && <img src={logoImage} alt="AI Avatar" className="w-8 h-8 rounded-full flex-shrink-0" />}
                                <div className={`max-w-2xl px-5 py-3 rounded-2xl ${msg.sender === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none'}`}>
                                    <p className="font-sans whitespace-pre-wrap">{msg.text}</p>
                                </div>
                            </div>
                        ))}

                        {isLoading && (
                            <div className="flex gap-4 justify-start">
                                <img src={logoImage} alt="AI Avatar" className="w-8 h-8 rounded-full flex-shrink-0" />
                                <div className="max-w-2xl px-5 py-3 rounded-2xl bg-white text-gray-800 border border-gray-200 rounded-bl-none">
                                    <div className="flex items-center space-x-2">
                                        <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse [animation-delay:-0.3s]"></div>
                                        <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse [animation-delay:-0.15s]"></div>
                                        <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse"></div>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                </div>

                {/* Input Area */}
                <div className="bg-gray-100 border-t border-gray-200 p-4"> {/* Bỏ sticky ở đây vì cha đã là flex */}
                    <form onSubmit={handleSend} className="max-w-4xl mx-auto">
                        <div className="relative">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Đặt câu hỏi cho Trợ lý AI..."
                                className="w-full pl-4 pr-14 py-3 border border-gray-300 rounded-full shadow-sm focus:outline-none focus:ring-2 focus:ring-primaryRed font-sans"
                            />
                            <button
                                type="submit"
                                disabled={isLoading || input.trim() === ''}
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 bg-primaryRed text-white rounded-full hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                            >
                                <PaperAirplaneIcon className="h-5 w-5" />
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default AiChatPage;