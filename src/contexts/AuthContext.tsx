import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface User {
  username: string;
  role: string;
  id: string;
}

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string, remember: boolean) => boolean;
  logout: () => void;
  isLoading: boolean;
  showPassword: boolean;
  togglePasswordVisibility: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  // Secure storage with versioning and validation
  const STORAGE_KEYS = {
    USER: 'pos_user_v2',
    REMEMBER: 'pos_remember',
    TIMESTAMP: 'pos_login_time'
  };

  // Auto-logout after certain period (optional security measure)
  const MAX_SESSION_AGE = 30 * 24 * 60 * 60 * 1000; // 30 days max for "Remember Me"
  const SESSION_AGE = 12 * 60 * 60 * 1000; // 12 hours for normal session

  const validateStoredUser = useCallback((storedUser: any): storedUser is User => {
    return (
      storedUser &&
      typeof storedUser === 'object' &&
      typeof storedUser.username === 'string' &&
      typeof storedUser.role === 'string' &&
      typeof storedUser.id === 'string'
    );
  }, []);

  const clearAuthData = useCallback(() => {
    localStorage.removeItem(STORAGE_KEYS.USER);
    localStorage.removeItem(STORAGE_KEYS.REMEMBER);
    localStorage.removeItem(STORAGE_KEYS.TIMESTAMP);
    sessionStorage.removeItem(STORAGE_KEYS.USER);
    sessionStorage.removeItem(STORAGE_KEYS.TIMESTAMP);
  }, []);

  const togglePasswordVisibility = useCallback(() => {
    setShowPassword(prev => !prev);
  }, []);

  useEffect(() => {
    const initializeAuth = () => {
      try {
        setIsLoading(true);
        
        // Check for stored authentication
        const remember = localStorage.getItem(STORAGE_KEYS.REMEMBER) === 'true';
        const storage = remember ? localStorage : sessionStorage;
        
        const storedUser = storage.getItem(STORAGE_KEYS.USER);
        const loginTime = storage.getItem(STORAGE_KEYS.TIMESTAMP);
        
        if (storedUser && loginTime) {
          const userData = JSON.parse(storedUser);
          const loginTimestamp = parseInt(loginTime);
          const now = Date.now();
          const sessionAge = now - loginTimestamp;
          
          // Validate session age
          const maxAge = remember ? MAX_SESSION_AGE : SESSION_AGE;
          
          if (validateStoredUser(userData) && sessionAge < maxAge) {
            setUser(userData);
          } else {
            // Session expired or invalid data
            clearAuthData();
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        clearAuthData();
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, [clearAuthData, validateStoredUser]);

  const login = (username: string, password: string, remember: boolean): boolean => {
    try {
      // Simple authentication - in production, this would be an API call
      const validUsers = [
        { id: '1', username: 'admin', password: 'admin123', role: 'admin' },
        { id: '2', username: 'cashier', password: 'cashier123', role: 'cashier' }
      ];

      const validUser = validUsers.find(u => u.username === username && u.password === password);
      
      if (validUser) {
        const userData: User = {
          username: validUser.username,
          role: validUser.role,
          id: validUser.id
        };
        
        setUser(userData);
        
        const storage = remember ? localStorage : sessionStorage;
        const loginTime = Date.now().toString();
        
        // Store user data and login timestamp
        storage.setItem(STORAGE_KEYS.USER, JSON.stringify(userData));
        storage.setItem(STORAGE_KEYS.TIMESTAMP, loginTime);
        
        if (remember) {
          localStorage.setItem(STORAGE_KEYS.REMEMBER, 'true');
        } else {
          localStorage.removeItem(STORAGE_KEYS.REMEMBER);
        }
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = useCallback(() => {
    setUser(null);
    clearAuthData();
  }, [clearAuthData]);

  // Optional: Auto-logout after session expiry (runs every minute)
  useEffect(() => {
    const checkSessionExpiry = () => {
      if (user) {
        const remember = localStorage.getItem(STORAGE_KEYS.REMEMBER) === 'true';
        const storage = remember ? localStorage : sessionStorage;
        const loginTime = storage.getItem(STORAGE_KEYS.TIMESTAMP);
        
        if (loginTime) {
          const loginTimestamp = parseInt(loginTime);
          const now = Date.now();
          const sessionAge = now - loginTimestamp;
          const maxAge = remember ? MAX_SESSION_AGE : SESSION_AGE;
          
          if (sessionAge >= maxAge) {
            logout();
          }
        }
      }
    };

    const interval = setInterval(checkSessionExpiry, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [user, logout]);

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      logout, 
      isLoading,
      showPassword,
      togglePasswordVisibility
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};