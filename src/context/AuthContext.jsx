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

  const signOut = useCallback(() => {
    console.log('[AuthContext] Đang thực hiện đăng xuất...');
    localStorage.removeItem('token');
    delete apiClient.defaults.headers.common['Authorization'];
    setUser(null);
    console.log('[AuthContext] Đăng xuất thành công.');
  }, []);

  const value = { user, loading, signIn, signOut };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};