import React, { createContext, useContext, useState, useEffect } from 'react';

interface AuthContextType {
  user: { username: string; role: string } | null;
  login: (username: string, password: string, remember: boolean) => boolean;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<{ username: string; role: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored authentication
    const storedUser = localStorage.getItem('pos_user');
    const remember = localStorage.getItem('pos_remember') === 'true';
    
    if (remember && storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = (username: string, password: string, remember: boolean): boolean => {
    // Simple authentication - in production, use proper auth
    const validUsers = [
      { username: 'admin', password: 'admin123', role: 'admin' },
      { username: 'cashier', password: 'cashier123', role: 'cashier' }
    ];

    const validUser = validUsers.find(u => u.username === username && u.password === password);
    
    if (validUser) {
      const userData = { username: validUser.username, role: validUser.role };
      setUser(userData);
      
      if (remember) {
        localStorage.setItem('pos_user', JSON.stringify(userData));
        localStorage.setItem('pos_remember', 'true');
      } else {
        sessionStorage.setItem('pos_user', JSON.stringify(userData));
      }
      
      return true;
    }
    
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('pos_user');
    localStorage.removeItem('pos_remember');
    sessionStorage.removeItem('pos_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
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