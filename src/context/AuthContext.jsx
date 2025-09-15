import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import apiClient from '../api/client';

const AuthContext = createContext(null);

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      console.log('[AuthContext] Bắt đầu khởi tạo...');
      const token = localStorage.getItem('token');
      console.log('[AuthContext] Token tìm thấy trong localStorage:', token);

      if (token) {
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        try {
          console.log('[AuthContext] Đang xác thực token bằng cách gọi /auth/me...');
          const response = await apiClient.get('/auth/me');
          console.log('[AuthContext] Xác thực token thành công. Dữ liệu người dùng:', response.data);
          setUser(response.data);
        } catch (error) {
          console.error("[AuthContext] Token không hợp lệ hoặc đã hết hạn. Đang đăng xuất...", error);
          localStorage.removeItem('token');
          delete apiClient.defaults.headers.common['Authorization'];
        }
      } else {
          console.log('[AuthContext] Không tìm thấy token trong localStorage.');
      }
      setLoading(false);
      console.log('[AuthContext] Khởi tạo hoàn tất. Trạng thái loading: false.');
    };
    initializeAuth();
  }, []);

  const signIn = useCallback(async (username, password) => {
    console.log('[AuthContext] Đang thực hiện đăng nhập...');
    try {
      const response = await apiClient.post('/auth/login', { username, password });
      const { token, user: userData } = response.data;
      
      localStorage.setItem('token', token);
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(userData);
      console.log('[AuthContext] Đăng nhập thành công. Đã thiết lập người dùng:', userData);
      return userData;
    } catch (error) {
      console.error('[AuthContext] Đăng nhập thất bại:', error);
      throw error;
    }
  }, []);

  const signOut = useCallback(async () => { // 1. Chuyển hàm thành async
  console.log('[AuthContext] Đang thực hiện đăng xuất...');

  try {
    // 2. GỌI API ĐĂNG XUẤT TRƯỚC
    // Endpoint này cần token để xác thực, nên phải gọi trước khi xoá token ở client
    await apiClient.post('/auth/logout');
    console.log('[AuthContext] Đã gửi yêu cầu xoá push token đến server.');

  } catch (error) {
    // Ngay cả khi gọi API thất bại (ví dụ: mất mạng), chúng ta vẫn muốn
    // tiến hành đăng xuất ở phía client để người dùng không bị kẹt.
    console.error('[AuthContext] Lỗi khi gọi API đăng xuất, nhưng vẫn tiếp tục:', error);
  } finally {
    // 3. DỌN DẸP PHÍA CLIENT (giống code cũ của bạn)
    // Đặt trong finally để đảm bảo nó luôn được thực thi
    console.log('[AuthContext] Dọn dẹp token ở client...');
    localStorage.removeItem('token');
    delete apiClient.defaults.headers.common['Authorization'];
    setUser(null);
    console.log('[AuthContext] Đăng xuất thành công ở client.');
  }
}, []);

  const value = { user, loading, signIn, signOut };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};