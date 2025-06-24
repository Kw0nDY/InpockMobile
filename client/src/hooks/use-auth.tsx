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
  
  // 저장소에서 사용자 정보 초기화
  useEffect(() => {
    const savedUser = localStorage.getItem('auth_user');
    const rememberMe = localStorage.getItem('auth_remember_me') === 'true';
    const sessionUser = sessionStorage.getItem('auth_user_session');
    
    if (savedUser && rememberMe) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
      } catch (error) {
        console.error('저장된 사용자 정보 파싱 오류:', error);
        localStorage.removeItem('auth_user');
        localStorage.removeItem('auth_remember_me');
      }
    } else if (sessionUser) {
      try {
        const parsedUser = JSON.parse(sessionUser);
        setUser(parsedUser);
      } catch (error) {
        console.error('Error parsing session user:', error);
        sessionStorage.removeItem('auth_user_session');
      }
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
      const response = await apiRequest("POST", "/api/auth/login", { username, password });
      const data = await response.json();
      return { data, rememberMe };
    },
    onSuccess: ({ data, rememberMe }) => {
      setUser(data.user);
      saveUserToStorage(data.user, rememberMe || false);
    },
  });

  const login = async (username: string, password: string, rememberMe?: boolean) => {
    await loginMutation.mutateAsync({ username, password, rememberMe });
  };

  const logout = () => {
    setUser(null);
    saveUserToStorage(null, false);
  };

  const checkRegistrationComplete = () => {
    if (!user) return false;
    return !!(user.username && user.phone && user.name);
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
