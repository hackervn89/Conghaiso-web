import React, { useState, useRef, useEffect } from 'react';
import apiClient from '../../api/client';
import logoImage from '../../assets/logo.png'; 
import ReactMarkdown from 'react-markdown';
import trongDongBg from '../../assets/trongdong1.png'; // Import hình ảnh trống đồng
import { PaperAirplaneIcon } from '@heroicons/react/24/solid';
//AI
const AiChatPage = () => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);
    const textareaRef = useRef(null); // Ref cho textarea

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [messages, isLoading]);

    // Tự động điều chỉnh chiều cao của textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto'; // Reset chiều cao
            const scrollHeight = textareaRef.current.scrollHeight;
            textareaRef.current.style.height = `${scrollHeight}px`; // Set chiều cao mới
        }
    }, [input]); // Chạy mỗi khi input thay đổi

    const handleSend = async (e) => {
        e.preventDefault();
        if (input.trim() === '' || isLoading) return;

        const userMessageForUI = { role: 'user', parts: [{ text: input }] };
        
        // 1. Ghi lại lịch sử hiện tại (chưa bao gồm tin nhắn người dùng mới) để gửi lên backend
        const currentHistory = [...messages];
        const promptText = input; // Lưu trữ input trước khi xóa

        // 2. Cập nhật UI ngay lập tức (Optimistic Update) với tin nhắn của người dùng
        setMessages(prev => [...prev, userMessageForUI]);
        setInput('');
        setIsLoading(true);

        try {
            // Gửi yêu cầu đến backend với lịch sử *trước khi* thêm tin nhắn mới của người dùng
            const response = await apiClient.post('/chat', { // Sửa endpoint
                prompt: promptText,                
                history: currentHistory, 
            });

            // 4. Cập nhật toàn bộ lịch sử chat bằng dữ liệu mới từ backend
            if (response.data && response.data.history) {
                setMessages(response.data.history);
            }
        } catch (error) {
            // Nếu có lỗi, hoàn tác lại tin nhắn của người dùng đã thêm lạc quan
             setMessages(currentHistory); 
            alert('Xin lỗi, đã có lỗi xảy ra khi kết nối với Trợ lý AI. Vui lòng thử lại.');
            console.error("Chat API error:", error);
        } finally {
            setIsLoading(false);
        }
    };

    // Xử lý khi nhấn phím trong textarea
    const handleKeyDown = (e) => {
        // Nếu nhấn Enter (không kèm Shift) thì gửi tin nhắn
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault(); // Ngăn hành vi mặc định (xuống dòng)
            handleSend(e);
        }
    };

    return (
        <div className="flex flex-col h-full">
            <div className="max-w-4xl mx-auto w-full flex-1 flex flex-col relative bg-white rounded-xl max-h-[calc(100vh-112px)]"> {/* Khung chính trong suốt để thấy nền trống đồng */}
                {/* Lớp nền trống đồng mờ, giờ là con trực tiếp của khung chat chính */}
                <div
                    className="absolute inset-0 z-0 rounded-xl" // Thêm rounded-xl để khớp với bo góc của khung chính
                    style={{
                        backgroundImage: `url(${trongDongBg})`,
                        backgroundSize: 'contain',
                        backgroundPosition: 'center',
                        backgroundRepeat: 'no-repeat',
                        opacity: 0.2 // Làm mờ hình ảnh trống đồng
                    }}
                ></div>

                {/* Message List */}
                <div className="flex-1 overflow-y-auto p-4 rounded-t-xl relative z-10" id="message-list"> {/* Đảm bảo z-index cao hơn nền */}
                    {/* Nội dung tin nhắn, đảm bảo hiển thị trên lớp nền */}
                    <div className="space-y-5"> {/* Không cần relative z-10 ở đây nữa */}
                        {messages.length === 0 && !isLoading ? (
                            <div className="h-full flex flex-col items-center justify-center text-center">
                                <h1 className="text-2xl font-bold text-primaryRed mb-2">ChatCHS</h1>
                                <h2 className="text-2xl font-bold text-primaryRed mb-2">Trợ lý AI Công Hải Số</h2>
                                <p className="text-gray-600">Tôi có thể giúp gì cho bạn hôm nay?</p>
                            </div>
                        ) : (
                            <>

                        {messages.map((msg, index) => (
                            <div key={index} className={`flex items-start gap-3 animate-fade-in-up ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                {msg.role === 'model' && <img src={logoImage} alt="AI Avatar" className="w-8 h-8 rounded-full flex-shrink-0 border border-red-100 p-0.5" />}
                                <div className={`max-w-2xl px-4 py-2 rounded-xl shadow-sm ${msg.role === 'user' ? 'bg-primaryRed text-white rounded-br-none' : 'bg-white text-gray-800 rounded-bl-none border border-red-100'}`}>
                                    {msg.role === 'user' ? (
                                        <p className="font-sans whitespace-pre-wrap">{msg.parts[0].text}</p>
                                    ) : (
                                        <div className="prose prose-sm max-w-none">
                                            <ReactMarkdown>{msg.parts[0].text}</ReactMarkdown>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}

                        {isLoading && (
                            <div className="flex items-start gap-3 justify-start">
                                <img src={logoImage} alt="AI Avatar" className="w-8 h-8 rounded-full flex-shrink-0 border border-red-100 p-0.5" />
                                <div className="max-w-2xl px-4 py-2 rounded-xl bg-white text-gray-800 rounded-bl-none shadow-sm border border-red-100">
                                    <div className="flex items-center space-x-2">
                                        <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse [animation-delay:-0.3s]"></div>
                                        <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse [animation-delay:-0.15s]"></div>
                                        <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse"></div>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                            </>
                        )}
                    </div>
                </div>

                {/* Input Area */}
                <div className="border-t border-red-200 p-4 rounded-b-xl bg-white shadow-inner relative z-10"> {/* Nền trắng cho khu vực nhập liệu và z-index cao hơn */}
                    <form onSubmit={handleSend} className="max-w-4xl mx-auto flex items-end gap-3">
                        <div className="relative flex-1">
                            <textarea
                                ref={textareaRef}
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Đặt câu hỏi cho Trợ lý AI..."
                                rows="1"
                                style={{ maxHeight: '150px' }} // Giới hạn chiều cao tối đa
                                className={`w-full pl-4 pr-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primaryRed focus:border-transparent font-sans transition-all resize-none overflow-y-auto bg-white`}
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={isLoading || input.trim() === ''}                            
                            className="flex-shrink-0 p-3 bg-primaryRed text-white rounded-full hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-200 ease-in-out transform hover:scale-110"
                        >
                            <PaperAirplaneIcon className="h-6 w-6" />
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default AiChatPage;

/* 
   Để hiệu ứng animation hoạt động, bạn cần thêm cấu hình này vào file tailwind.config.js

   // tailwind.config.js
   module.exports = {
     // ...
     theme: {
       extend: {
         animation: {
           'fade-in-up': 'fade-in-up 0.5s ease-out forwards',
         },
         keyframes: {
           'fade-in-up': {
             '0%': { opacity: '0', transform: 'translateY(10px)' },
             '100%': { opacity: '1', transform: 'translateY(0)' },
           },
         },
       },
     },
     // ...
   }
*/