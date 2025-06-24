import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface User {
  id: number;
  username: string;
  email: string;
  name: string;
  phone?: string;
  company?: string;
  role: string;
  bio?: string;
  profileImageUrl?: string;
  introVideoUrl?: string;
  visitCount?: number;
}

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string, rememberMe?: boolean) => Promise<void>;
  logout: () => void;
  setUser: (user: User | null) => void;
  isLoading: boolean;
  checkRegistrationComplete: () => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  
  // 저장소에서 사용자 정보 초기화 (오류 방지 강화)
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('auth_user');
      const rememberMe = localStorage.getItem('auth_remember_me') === 'true';
      const sessionUser = sessionStorage.getItem('auth_user_session');
      
      if (savedUser && rememberMe) {
        try {
          const parsedUser = JSON.parse(savedUser);
          
          // Validate parsed user data
          if (parsedUser && typeof parsedUser === 'object' && parsedUser.id && parsedUser.username) {
            setUser(parsedUser);
          } else {
            console.warn('Invalid user data in localStorage, clearing...');
            localStorage.removeItem('auth_user');
            localStorage.removeItem('auth_remember_me');
          }
        } catch (parseError) {
          console.error('저장된 사용자 정보 파싱 오류:', parseError);
          localStorage.removeItem('auth_user');
          localStorage.removeItem('auth_remember_me');
        }
      } else if (sessionUser) {
        try {
          const parsedUser = JSON.parse(sessionUser);
          
          // Validate parsed user data
          if (parsedUser && typeof parsedUser === 'object' && parsedUser.id && parsedUser.username) {
            setUser(parsedUser);
          } else {
            console.warn('Invalid user data in sessionStorage, clearing...');
            sessionStorage.removeItem('auth_user_session');
          }
        } catch (parseError) {
          console.error('세션 사용자 정보 파싱 오류:', parseError);
          sessionStorage.removeItem('auth_user_session');
        }
      }
    } catch (storageError) {
      console.error('localStorage/sessionStorage access error:', storageError);
    }
  }, []);

  // Save user to localStorage when remember me is enabled
  const saveUserToStorage = (userData: User | null, remember: boolean = false) => {
    if (userData && remember) {
      localStorage.setItem('auth_user', JSON.stringify(userData));
      localStorage.setItem('auth_remember_me', 'true');
    } else if (userData && !remember) {
      // Store user for session only (will be cleared on browser close)
      sessionStorage.setItem('auth_user_session', JSON.stringify(userData));
      localStorage.removeItem('auth_user');
      localStorage.removeItem('auth_remember_me');
    } else {
      // Clear all stored data on logout
      localStorage.removeItem('auth_user');
      localStorage.removeItem('auth_remember_me');
      sessionStorage.removeItem('auth_user_session');
    }
  };

  const loginMutation = useMutation({
    mutationFn: async ({ username, password, rememberMe }: { username: string; password: string; rememberMe?: boolean }) => {
      try {
        // Input validation
        if (!username || !password) {
          throw new Error("사용자명과 비밀번호를 모두 입력해주세요");
        }
        
        if (username.trim().length < 3) {
          throw new Error("사용자명은 3자 이상이어야 합니다");
        }
        
        if (password.length < 6) {
          throw new Error("비밀번호는 6자 이상이어야 합니다");
        }
        
        const response = await apiRequest("POST", "/api/auth/login", { 
          username: username.trim(), 
          password 
        });
        const data = await response.json();
        
        // Validate response data
        if (!data || typeof data !== 'object') {
          throw new Error("서버에서 잘못된 응답을 받았습니다");
        }
        
        if (!data.user || typeof data.user !== 'object' || !data.user.id || !data.user.username) {
          throw new Error("로그인 응답에서 유효한 사용자 정보를 찾을 수 없습니다");
        }
        
        return { data, rememberMe };
      } catch (error) {
        console.error('로그인 처리 오류:', error);
        throw error;
      }
    },
    onSuccess: ({ data, rememberMe }) => {
      try {
        setUser(data.user);
        
        // Store user data with error handling
        if (rememberMe) {
          try {
            localStorage.setItem('auth_user', JSON.stringify(data.user));
            localStorage.setItem('auth_remember_me', 'true');
            sessionStorage.removeItem('auth_user_session');
          } catch (storageError) {
            console.warn('Failed to save to localStorage:', storageError);
          }
        } else {
          try {
            sessionStorage.setItem('auth_user_session', JSON.stringify(data.user));
            localStorage.removeItem('auth_user');
            localStorage.removeItem('auth_remember_me');
          } catch (storageError) {
            console.warn('Failed to save to sessionStorage:', storageError);
          }
        }
      } catch (error) {
        console.error('Post-login processing error:', error);
      }
    },
    onError: (error) => {
      console.error('로그인 오류:', error);
      // Clear any stored auth data on login failure
      try {
        localStorage.removeItem('auth_user');
        localStorage.removeItem('auth_remember_me');
        sessionStorage.removeItem('auth_user_session');
      } catch (storageError) {
        console.warn('Failed to clear auth storage:', storageError);
      }
    }
  });

  const login = async (username: string, password: string, rememberMe?: boolean) => {
    await loginMutation.mutateAsync({ username, password, rememberMe });
  };

  const logout = () => {
    try {
      setUser(null);
      
      // Clear all auth-related storage
      try {
        localStorage.removeItem('auth_user');
        localStorage.removeItem('auth_remember_me');
        sessionStorage.removeItem('auth_user_session');
      } catch (storageError) {
        console.warn('Failed to clear auth storage during logout:', storageError);
      }
      
      // Optional: Call server logout endpoint
      apiRequest("POST", "/api/auth/logout", {}).catch(error => {
        console.warn('Server logout failed (but local logout succeeded):', error);
      });
      
    } catch (error) {
      console.error('Logout error:', error);
      // Force user state clear even if other operations fail
      setUser(null);
    }
  };

  const checkRegistrationComplete = () => {
    try {
      if (!user || typeof user !== 'object') return false;
      
      // Check for required fields with proper validation
      const hasRequiredFields = !!(
        user.name && 
        user.email && 
        user.username &&
        typeof user.name === 'string' &&
        typeof user.email === 'string' &&
        typeof user.username === 'string' &&
        user.name.trim().length > 0 &&
        user.email.includes('@') &&
        user.username.trim().length >= 3
      );
      
      return hasRequiredFields;
    } catch (error) {
      console.error('Error checking registration completion:', error);
      return false;
    }
  };

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        login, 
        logout, 
        setUser,
        isLoading: loginMutation.isPending,
        checkRegistrationComplete
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth는 AuthProvider 내에서 사용되어야 합니다");
  }
  return context;
}
