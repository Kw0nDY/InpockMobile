import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface User {
  id: number;
  username: string;
  email: string;
  name: string;
  company?: string;
  role: string;
  bio?: string;
  profileImageUrl?: string;
  introVideoUrl?: string;
  visitCount?: number;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  setUser: (user: User | null) => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    // Try to load user from localStorage on initialization
    try {
      const savedUser = localStorage.getItem('auth_user');
      if (savedUser) {
        return JSON.parse(savedUser);
      }
      // If no saved user, create a demo user for testing
      const demoUser = {
        id: 1,
        username: "demo",
        email: "demo@example.com",
        name: "데모 사용자",
        company: "데모 회사",
        role: "user",
        bio: "안녕하세요! 데모 사용자입니다.",
        profileImageUrl: "",
        introVideoUrl: "",
        visitCount: 0
      };
      localStorage.setItem('auth_user', JSON.stringify(demoUser));
      return demoUser;
    } catch {
      return null;
    }
  });

  // Save user to localStorage whenever user state changes
  useEffect(() => {
    if (user) {
      localStorage.setItem('auth_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('auth_user');
    }
  }, [user]);

  const loginMutation = useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const response = await apiRequest("POST", "/api/auth/login", { email, password });
      return response.json();
    },
    onSuccess: (data) => {
      setUser(data.user);
    },
  });

  const login = async (email: string, password: string) => {
    await loginMutation.mutateAsync({ email, password });
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        login, 
        logout, 
        setUser,
        isLoading: loginMutation.isPending 
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
