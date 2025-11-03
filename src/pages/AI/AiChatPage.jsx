import React, { useState, useRef, useEffect } from 'react';
import apiClient from '../../api/client';
import logoImage from '../../assets/logo.png'; 
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm'; 
import trongDongBg from '../../assets/trongdong1.png';
import { PaperAirplaneIcon, PlusIcon, ChatBubbleLeftRightIcon, TrashIcon, Bars3Icon } from '@heroicons/react/24/solid';

const AiChatPage = () => {
    // State cho cuộc trò chuyện hiện tại
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [currentSessionId, setCurrentSessionId] = useState(null);

    // State cho lịch sử các phiên chat (sidebar)
    const [sessions, setSessions] = useState([]);
    const [isSessionsLoading, setIsSessionsLoading] = useState(true);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false); // State cho sidebar trên mobile

    const messagesEndRef = useRef(null);
    const textareaRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    // Lấy danh sách các phiên chat khi component được mount
    useEffect(() => {
        fetchSessions();
    }, []);

    // Cuộn xuống cuối khi có tin nhắn mới hoặc đang loading
    useEffect(() => {
        scrollToBottom();
    }, [messages, isLoading]);

    // Tự động điều chỉnh chiều cao của textarea khi nhập liệu
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            const scrollHeight = textareaRef.current.scrollHeight;
            textareaRef.current.style.height = `${scrollHeight}px`;
        }
    }, [input]);

    const fetchSessions = async () => {
        setIsSessionsLoading(true);
        try {
            const response = await apiClient.get('/chat/sessions');
            setSessions(response.data);
        } catch (error) {
            console.error("Failed to fetch chat sessions:", error);
            alert('Không thể tải lịch sử trò chuyện.');
        } finally {
            setIsSessionsLoading(false);
        }
    };

    const handleSelectSession = async (sessionId) => {
        if (isLoading || sessionId === currentSessionId) return;
        setIsLoading(true);
        setMessages([]); // Xóa tin nhắn cũ
        try {
            const response = await apiClient.get(`/chat/sessions/${sessionId}`);
            setMessages(response.data);
            setCurrentSessionId(sessionId);
        } catch (error) {
            console.error(`Failed to fetch messages for session ${sessionId}:`, error);
            alert('Không thể tải nội dung cuộc trò chuyện.');
            // Nếu lỗi, quay về trạng thái chat mới
            handleNewChat();
        } finally {
            // Đóng sidebar trên mobile sau khi chọn
            if (window.innerWidth < 768) {
                setIsSidebarOpen(false);
            }
            setIsLoading(false);
        }
    };

    const handleNewChat = () => {
        if (isLoading) return;
        setMessages([]);
        setCurrentSessionId(null);
        setInput('');
        // Đóng sidebar trên mobile sau khi tạo chat mới
        if (window.innerWidth < 768) {
            setIsSidebarOpen(false);
        }
    };

    const handleSend = async (e) => {
        if (e) e.preventDefault();
        if (input.trim() === '' || isLoading) return;

        const userMessageForUI = { role: 'user', parts: [{ text: input }] };
        const promptText = input;

        // Cập nhật UI ngay lập tức (Optimistic Update)
        setMessages(prev => [...prev, userMessageForUI]);
        setInput('');
        setIsLoading(true);

        try {
            const response = await apiClient.post('/chat', {
                prompt: promptText,
                sessionId: currentSessionId,
            });

            const aiMessage = { role: 'model', parts: [{ text: response.data.reply }] };
            setMessages(prev => [...prev, aiMessage]);

            // Nếu là tin nhắn đầu tiên, lưu sessionId và làm mới danh sách sidebar
            if (!currentSessionId && response.data.sessionId) {
                setCurrentSessionId(response.data.sessionId);
                fetchSessions(); // Tải lại danh sách để hiển thị cuộc trò chuyện mới
            }
        } catch (error) {
            // Hoàn tác tin nhắn người dùng nếu có lỗi
            setMessages(prev => prev.slice(0, -1));
            alert('Xin lỗi, đã có lỗi xảy ra khi kết nối với Trợ lý AI. Vui lòng thử lại.');
            console.error("Chat API error:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteSession = async (e, sessionIdToDelete) => {
        e.stopPropagation(); // Ngăn không cho sự kiện click vào session chạy
        if (window.confirm('Bạn có chắc chắn muốn xóa cuộc trò chuyện này?')) {
            try {
                await apiClient.delete(`/chat/sessions/${sessionIdToDelete}`);
                // Xóa khỏi state
                setSessions(prev => prev.filter(s => s.session_id !== sessionIdToDelete));
                // Nếu đang xem session bị xóa thì tạo chat mới
                if (currentSessionId === sessionIdToDelete) {
                    handleNewChat();
                }
            } catch (error) {
                console.error(`Failed to delete session ${sessionIdToDelete}:`, error);
                alert('Xóa cuộc trò chuyện thất bại.');
            }
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend(e);
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    // Tùy chỉnh cách ReactMarkdown render các thành phần
    const markdownComponents = {
        // Ghi đè cách render thẻ <strong>
        strong: ({ node, ...props }) => {
            // Kiểm tra xem nội dung bên trong có phải là 'chatCHS' không
            if (node?.children[0]?.type === 'text' && node.children[0].value === 'chatCHS') {
                // Nếu đúng, áp dụng class đặc biệt
                return <strong className="text-primaryRed font-bold">{props.children}</strong>;
            }
            // Nếu không, render như bình thường
            return <strong {...props}>{props.children}</strong>;
        },
    };
    return (
        <div className="relative flex h-full max-h-[calc(100vh-112px)] bg-white rounded-xl shadow-lg">
            {/* Overlay for mobile when sidebar is open */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                ></div>
            )}

            {/* Sidebar lịch sử chat */}
            <aside className={`absolute md:relative top-0 left-0 h-full w-64 bg-gray-50/50 border-r border-red-100 flex flex-col flex-shrink-0 z-30 transform transition-transform duration-300 ease-in-out rounded-l-xl md:rounded-l-xl 
                             ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}> 
                
                <div className="p-2 border-b border-red-100 flex-shrink-0"> 
                    <button onClick={handleNewChat} className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-primaryRed bg-white border border-primaryRed rounded-lg hover:bg-red-50 transition-colors">
                        <PlusIcon className="h-5 w-5" />
                        Trò chuyện mới
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    {isSessionsLoading ? (
                        <p className="text-center text-gray-500 text-sm p-4">Đang tải lịch sử...</p>
                    ) : sessions.length > 0 ? (
                        sessions.map(session => (
                            <div
                                key={session.session_id}
                                onClick={() => handleSelectSession(session.session_id)}
                                className={`group relative p-2.5 rounded-lg cursor-pointer transition-colors ${currentSessionId === session.session_id ? 'bg-red-100' : 'hover:bg-gray-100'}`}
                            >
                                <p className="text-sm font-medium text-gray-800 truncate pr-8">{session.title || 'Cuộc trò chuyện mới'}</p>
                                <p className="text-xs text-gray-500">{formatDate(session.created_at)}</p>
                                <button
                                    onClick={(e) => handleDeleteSession(e, session.session_id)}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 rounded-full hover:bg-red-200 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <TrashIcon className="h-4 w-4" />
                                </button>
                            </div>
                        ))
                    ) : (
                         <div className="text-center text-gray-500 p-4 text-sm">
                            <ChatBubbleLeftRightIcon className="h-8 w-8 mx-auto mb-2 text-gray-400"/>
                            Chưa có cuộc trò chuyện nào.
                        </div>
                    )}
                </div>
            </aside>

            {/* Khung chat chính */}
            <main className="flex flex-col flex-1 min-w-0 h-full">
                {/* Header của khung chat chính (chỉ hiển thị trên mobile) */}
                <div className="md:hidden flex items-center p-2 border-b border-red-100 flex-shrink-0">
                    <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-gray-600 hover:text-primaryRed">
                        <Bars3Icon className="h-6 w-6" />
                    </button>
                    <h2 className="text-lg font-semibold text-primaryRed mx-auto truncate px-2">{currentSessionId ? sessions.find(s => s.session_id === currentSessionId)?.title || 'Cuộc trò chuyện' : 'Trò chuyện mới'}</h2>
                    {/* Placeholder để căn giữa title */}
                    <div className="w-8"></div>
                </div>

                {/* Vùng chứa nội dung chat (scrollable) */}
                <div className="relative flex-1 min-h-0"> {/* Container chính cho vùng chat, không cuộn */}
                    {/* Lớp nền trống đồng, cố định so với container trên */}
                    <div 
                        className="absolute inset-0 z-0 pointer-events-none"
                        style={{ 
                            backgroundImage: `url(${trongDongBg})`, 
                            backgroundSize: 'contain', 
                            backgroundPosition: 'center', 
                            backgroundRepeat: 'no-repeat', 
                            opacity: 0.1
                        }} 
                    />
                    {/* Container cho tin nhắn, có thể cuộn và nằm trên lớp nền */}
                    <div className="absolute inset-0 overflow-y-auto p-4 z-10">
                        <div className="space-y-5 max-w-4xl mx-auto w-full">
                            {messages.length === 0 && !isLoading ? (
                                <div className="flex h-full flex-col items-center justify-center text-center">
                                    <h1 className="text-2xl font-bold text-primaryRed mb-2">ChatCHS</h1>
                                    <h2 className="text-2xl font-bold text-primaryRed mb-2">Trợ lý AI Công Hải Số</h2>
                                    <p className="text-gray-600">Tôi có thể giúp gì cho bạn hôm nay?</p>
                                </div>
                            ) : (
                                <>
                                    {messages.map((msg, index) => (
                                        <div key={index} className={`flex items-start gap-3 animate-fade-in-up ai-chat-content ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                            {msg.role === 'model' && <img src={logoImage} alt="AI Avatar" className="w-8 h-8 rounded-full flex-shrink-0 border border-red-100 p-0.5" />}
                                            <div className={`max-w-2xl px-4 py-2 rounded-xl shadow-sm ${msg.role === 'user' ? 'bg-primaryRed text-white rounded-br-none' : 'bg-white text-gray-800 rounded-bl-none border border-red-100'}`}>
                                                {msg.role === 'user' ? (
                                                    <p className="font-sans whitespace-pre-wrap">{msg.parts[0].text}</p>
                                                ) : (
                                                    <div className="prose prose-sm max-w-none">
                                                        <ReactMarkdown 
                                                            remarkPlugins={[remarkGfm]}
                                                            components={markdownComponents}
                                                        >{msg.parts[0].text}</ReactMarkdown>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}

                                    {isLoading && messages.length > 0 && (
                                        <div className="flex items-start gap-3 justify-start">
                                            <img src={logoImage} alt="AI Avatar" className="w-8 h-8 rounded-full flex-shrink-0 border border-red-100 p-0.5" />
                                            <div className="max-w-2xl px-4 py-2 rounded-xl bg-white text-gray-800 rounded-bl-none shadow-sm border border-red-100">
                                                <div className="flex items-center space-x-2">
                                                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse [animation-delay:-0.3s]" />
                                                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse [animation-delay:-0.15s]" />
                                                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse" />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    <div ref={messagesEndRef} />
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Khu vực nhập liệu (cố định ở dưới) */}
                <div className="p-4 bg-white md:rounded-br-xl flex-shrink-0">
                    <form onSubmit={handleSend} className="max-w-4xl mx-auto flex items-end gap-3">
                        <div className="relative flex-1">
                            <textarea
                                ref={textareaRef}
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Đặt câu hỏi cho Trợ lý AI..."
                                rows="1"
                                style={{ maxHeight: '150px' }}
                                className="w-full pl-4 pr-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primaryRed focus:border-transparent font-sans transition-all resize-none overflow-y-auto bg-white"
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
            </main>
        </div>
    );
};



export default AiChatPage;