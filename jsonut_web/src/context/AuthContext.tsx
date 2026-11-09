
import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import axiosClient from '../api/axiosClient';

type AuthContextType = {
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => sessionStorage.getItem('isLoggedIn') === 'true'
  );

  // LOGIN
  const login = async (email: string, password: string) => {
    try {
      const response = await axiosClient.post('/api/users/login', {
        email: email.trim(),
        password,
      });

      // Memeriksa respons server
      if (!response.data || response.data.success !== true) {
        throw new Error(
          response.data?.message || 'Login gagal.'
        );
      }

      // Memeriksa data pengguna
      if (!response.data.data || !response.data.data.role) {
        throw new Error('Respons login dari server tidak valid.');
      }

      // Memeriksa hak akses admin
      if (response.data.data.role !== 'admin') {
        throw new Error('Akun tidak memiliki akses admin.');
      }

      // Menyimpan status login selama sesi tab
      sessionStorage.setItem('isLoggedIn', 'true');
      setIsAuthenticated(true);

    } catch (error: any) {
      console.error('Error login:', error);

      if (error.response) {
        throw new Error(
          error.response.data?.message ||
          'Login gagal. Periksa email dan password.'
        );
      }

      if (error.message) {
        throw error;
      }

      throw new Error(
        'Tidak dapat terhubung ke server. Periksa koneksi Anda.'
      );
    }
  };

  // LOGOUT
  const logout = () => {
    sessionStorage.removeItem('isLoggedIn');
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// CUSTOM HOOK
export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      'useAuth harus digunakan di dalam AuthProvider.'
    );
  }

  return context;
}
