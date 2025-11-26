import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

interface User {
  id: string;
  email: string;
  name: string;
  picture?: string;
  role: string;
  spreadsheetId?: string;
}

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string, remember: boolean) => boolean;
  loginWithGoogle: () => void;
  connectGoogleSheet: (spreadsheetId: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
  showPassword: boolean;
  togglePasswordVisibility: () => void;
  isGoogleAuthenticated: boolean;
  sessionToken: string | null;
  googleError: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

declare global {
  interface Window {
    google: any;
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [googleError, setGoogleError] = useState<string | null>(null);
  const [isGoogleInitialized, setIsGoogleInitialized] = useState(false);

  const STORAGE_KEYS = {
    USER: 'pos_user_v3',
    REMEMBER: 'pos_remember',
    TIMESTAMP: 'pos_login_time',
    SESSION_TOKEN: 'pos_session_token',
  };

  const MAX_SESSION_AGE = 30 * 24 * 60 * 60 * 1000;
  const SESSION_AGE = 12 * 60 * 60 * 1000;

  const validateOrigin = useCallback(() => {
    const origin = window.location.origin;
    const protocol = window.location.protocol;
    
    if (protocol !== 'https:' && origin !== 'http://localhost' && !origin.startsWith('http://localhost:')) {
      console.warn('Google OAuth may not work properly without HTTPS');
      return false;
    }
    
    return true;
  }, []);

  const getValidatedOrigin = useCallback(() => {
    const origin = window.location.origin;
    
    if (origin.startsWith('http://localhost')) {
      return origin;
    }
    
    if (origin.startsWith('http://')) {
      return origin.replace('http://', 'https://');
    }
    
    return origin;
  }, []);

  const getGoogleAccessToken = async (): Promise<string | null> => {
  try {
    if (!window.google || !user) {
      return null;
    }

    const auth = window.google.accounts.oauth2;
    if (!auth) {
      console.error('Google OAuth2 not available');
      return null;
    }

    const tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
      scope: 'https://www.googleapis.com/auth/spreadsheets',
      callback: () => {},
    });

    return new Promise((resolve) => {
      tokenClient.callback = (response: any) => {
        if (response.error) {
          console.error('Error getting access token:', response.error);
          resolve(null);
        } else {
          resolve(response.access_token);
        }
      };

      tokenClient.requestAccessToken();
    });
  } catch (error) {
    console.error('Error getting Google access token:', error);
    return null;
  }
};

  useEffect(() => {
    const loadGoogleIdentity = () => {
      if (!validateOrigin()) {
        setGoogleError('Invalid origin for Google Sign-In. Please use HTTPS or localhost.');
        setIsLoading(false);
        return;
      }

      if (window.google) {
        console.log('Google Identity Services already loaded');
        initializeGoogleAuth();
        return;
      }

      if (document.getElementById('google-identity-script')) {
        return;
      }

      const script = document.createElement('script');
      script.id = 'google-identity-script';
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        console.log('Google Identity Services loaded successfully');
        initializeGoogleAuth();
      };
      script.onerror = () => {
        console.error('Failed to load Google Identity Services');
        setGoogleError('Failed to load Google Sign-In service. Please check your internet connection.');
        setIsLoading(false);
      };
      
      document.head.appendChild(script);
    };

    const initializeGoogleAuth = () => {
  if (!window.google) {
    console.error('Google Identity Services not available');
    setGoogleError('Google Sign-In service not available');
    setIsLoading(false);
    return;
  }

  try {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) {
      console.error('Google Client ID not configured');
      setGoogleError('Google Sign-In is not properly configured.');
      setIsLoading(false);
      return;
    }

    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: handleCredentialResponse,
      auto_select: false,
      cancel_on_tap_outside: true,
      context: 'signin',
      ux_mode: 'popup',
    });

    console.log('Google Sign-In initialized successfully');
    setIsGoogleInitialized(true);
    setGoogleError(null);

  } catch (error) {
    console.error('Error initializing Google Auth:', error);
    setGoogleError('Failed to initialize Google Sign-In. Please refresh the page.');
    setIsLoading(false);
  }
};

    loadGoogleIdentity();
  }, [user, isGoogleInitialized, validateOrigin, getValidatedOrigin]);

  const handleCredentialResponse = useCallback((response: any) => {
    console.log('Google credential response received');
    
    if (!response || !response.credential) {
      console.error('Invalid credential response from Google');
      setGoogleError('Invalid response from Google Sign-In');
      return;
    }
    
    try {
      const decodedToken = parseJwt(response.credential);
      
      console.log('Decoded Google token:', decodedToken);
      
      const userData: User = {
        id: decodedToken.sub,
        email: decodedToken.email,
        name: decodedToken.name,
        picture: decodedToken.picture,
        role: 'admin'
      };

      handleGoogleAuthBackend(response.credential, userData);
      
    } catch (error) {
      console.error('Error handling credential response:', error);
      setGoogleError('Failed to process Google Sign-In');
    }
  }, []);

  const parseJwt = (token: string) => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));

      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('Error parsing JWT:', error);
      throw new Error('Invalid JWT token');
    }
  };

  const validateStoredUser = useCallback((storedUser: any): storedUser is User => {
    return (
      storedUser &&
      typeof storedUser === 'object' &&
      typeof storedUser.email === 'string' &&
      typeof storedUser.name === 'string' &&
      typeof storedUser.role === 'string'
    );
  }, []);

  const clearAuthData = useCallback(() => {
    localStorage.removeItem(STORAGE_KEYS.USER);
    localStorage.removeItem(STORAGE_KEYS.REMEMBER);
    localStorage.removeItem(STORAGE_KEYS.TIMESTAMP);
    localStorage.removeItem(STORAGE_KEYS.SESSION_TOKEN);
    sessionStorage.removeItem(STORAGE_KEYS.USER);
    sessionStorage.removeItem(STORAGE_KEYS.TIMESTAMP);
    sessionStorage.removeItem(STORAGE_KEYS.SESSION_TOKEN);
  }, []);

  const togglePasswordVisibility = useCallback(() => {
    setShowPassword(prev => !prev);
  }, []);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setIsLoading(true);
        
        const remember = localStorage.getItem(STORAGE_KEYS.REMEMBER) === 'true';
        const storage = remember ? localStorage : sessionStorage;
        
        const storedUser = storage.getItem(STORAGE_KEYS.USER);
        const storedSessionToken = storage.getItem(STORAGE_KEYS.SESSION_TOKEN);
        const loginTime = storage.getItem(STORAGE_KEYS.TIMESTAMP);
        
        if (storedUser && loginTime && storedSessionToken) {
          const userData = JSON.parse(storedUser);
          const loginTimestamp = parseInt(loginTime);
          const now = Date.now();
          const sessionAge = now - loginTimestamp;
          
          const maxAge = remember ? MAX_SESSION_AGE : SESSION_AGE;
          
          if (validateStoredUser(userData) && sessionAge < maxAge) {
            setUser(userData);
            setSessionToken(storedSessionToken);
          } else {
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
      const validUsers = [
        { id: '1', username: 'admin', password: 'admin123', role: 'admin' },
        { id: '2', username: 'cashier', password: 'cashier123', role: 'cashier' }
      ];

      const validUser = validUsers.find(u => u.username === username && u.password === password);
      
      if (validUser) {
        const userData: User = {
          id: validUser.id,
          email: `${validUser.username}@demo.com`,
          name: validUser.username,
          role: validUser.role
        };
        
        setUser(userData);
        
        const storage = remember ? localStorage : sessionStorage;
        const loginTime = Date.now().toString();
        const demoToken = `demo_${Date.now()}`;
        
        storage.setItem(STORAGE_KEYS.USER, JSON.stringify(userData));
        storage.setItem(STORAGE_KEYS.TIMESTAMP, loginTime);
        storage.setItem(STORAGE_KEYS.SESSION_TOKEN, demoToken);
        
        if (remember) {
          localStorage.setItem(STORAGE_KEYS.REMEMBER, 'true');
        } else {
          localStorage.removeItem(STORAGE_KEYS.REMEMBER);
        }
        
        setSessionToken(demoToken);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const loginWithGoogle = () => {
    if (!window.google) {
      setGoogleError('Google Sign-In service not loaded. Please refresh the page.');
      return;
    }

    if (!isGoogleInitialized) {
      setGoogleError('Google Sign-In is not initialized yet. Please wait.');
      return;
    }

    try {
      setGoogleError(null);
      
      window.google.accounts.id.prompt();
      
    } catch (error) {
      console.error('Google Sign-In failed:', error);
      setGoogleError('Failed to start Google Sign-In');
    }
  };

  const handleGoogleAuthBackend = async (credential: string, userData: User) => {
  try {
    setIsLoading(true);
    setGoogleError(null);
    
    const backendUrl = import.meta.env.DEV 
      ? 'http://localhost:3001/api/auth/google' 
      : '/api/auth/google';
    
    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        idToken: credential,
      }),
    });

    if (response.ok) {
      const { user: verifiedUser, sessionToken: newSessionToken } = await response.json();
      
      setUser(verifiedUser);
      setSessionToken(newSessionToken);
      
      sessionStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(verifiedUser));
      sessionStorage.setItem(STORAGE_KEYS.SESSION_TOKEN, newSessionToken);
      sessionStorage.setItem(STORAGE_KEYS.TIMESTAMP, Date.now().toString());
      
      localStorage.removeItem(STORAGE_KEYS.REMEMBER);
      
      console.log('Backend Google auth successful');
    } else {
      const errorText = await response.text();
      console.error('Google auth backend failed:', errorText);
      setGoogleError('Failed to authenticate with server');
    }
  } catch (error) {
    console.error('Google auth backend error:', error);
    setGoogleError('Network error during authentication. Make sure the backend server is running on port 3001.');
  } finally {
    setIsLoading(false);
  }
};

  const revokeGoogleAccess = () => {
    if (window.google && user?.email && !user.email.endsWith('@demo.com')) {
      window.google.accounts.id.revoke(user.email, (done: any) => {
        console.log('Google access revoked');
      });
    }
  };

const connectGoogleSheet = async (spreadsheetId: string): Promise<boolean> => {
  try {
    if (!sessionToken) {
      throw new Error('No active session');
    }

    console.log('Getting Google access token for Sheets API...');
    
    const accessToken = await getGoogleAccessToken();
    
    if (!accessToken) {
      throw new Error('Failed to get Google access token for Sheets API. Please make sure you grant Sheets access.');
    }

    console.log('Access token obtained, connecting sheet...');

    const backendUrl = import.meta.env.DEV 
      ? 'http://localhost:3001/api/auth/connect-sheet' 
      : '/api/auth/connect-sheet';

    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${sessionToken}`
      },
      body: JSON.stringify({ 
        spreadsheetId,
        accessToken
      }),
    });

    if (response.ok) {
      const { user: updatedUser } = await response.json();
      setUser(updatedUser);
      
      const storage = sessionStorage;
      storage.setItem(STORAGE_KEYS.USER, JSON.stringify(updatedUser));
      
      console.log('Sheet connected successfully');
      return true;
    } else {
      const errorText = await response.text();
      console.error('Backend connection failed:', errorText);
      return false;
    }
  } catch (error) {
    console.error('Error connecting sheet:', error);
    return false;
  }
};

  const logout = useCallback(() => {
    revokeGoogleAccess();
    setUser(null);
    setSessionToken(null);
    setGoogleError(null);
    setIsGoogleInitialized(false);
    clearAuthData();
  }, [clearAuthData]);

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

    const interval = setInterval(checkSessionExpiry, 60000);
    return () => clearInterval(interval);
  }, [user, logout]);

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      loginWithGoogle,
      connectGoogleSheet,
      logout, 
      isLoading,
      showPassword,
      togglePasswordVisibility,
      isGoogleAuthenticated: !!user?.email && !user.email.endsWith('@demo.com'),
      sessionToken,
      googleError
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