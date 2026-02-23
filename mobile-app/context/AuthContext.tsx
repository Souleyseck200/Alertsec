import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, useSegments } from 'expo-router';
import socketService from '../services/socket';

interface AuthContextType {
  user: any | null;
  isLoading: boolean;
  hasFinishedOnboarding: boolean;
  selectedRole: 'CITIZEN' | 'AGENT' | null;
  login: (userData: any, token: string) => Promise<void>;
  register: (userData: any, token: string) => Promise<void>;
  logout: () => Promise<void>;
  finishOnboarding: (role: 'CITIZEN' | 'AGENT') => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasFinishedOnboarding, setHasFinishedOnboarding] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'CITIZEN' | 'AGENT' | null>(null);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    loadInitialState();
  }, []);

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';
    
    if (!user) {
      if (!hasFinishedOnboarding) {
        // Safe access to segments
        const currentSegment = segments as string[];
        if (currentSegment.length <= 1 || currentSegment[1] !== 'onboarding') {
          router.replace('/(auth)/onboarding');
        }
      } else if (!inAuthGroup) {
        router.replace('/(auth)/login');
      }
    } else if (inAuthGroup) {
      if (user.role === 'AGENT') {
        router.replace('/(agent)');
      } else {
        router.replace('/(citizen)');
      }
    }
  }, [user, segments, isLoading, hasFinishedOnboarding]);

  async function loadInitialState() {
    try {
      const [userData, onboardingStatus, role] = await Promise.all([
        AsyncStorage.getItem('user_data'),
        AsyncStorage.getItem('has_finished_onboarding'),
        AsyncStorage.getItem('selected_role')
      ]);

      if (onboardingStatus === 'true') {
        setHasFinishedOnboarding(true);
      }

      if (role) {
        setSelectedRole(role as 'CITIZEN' | 'AGENT');
      }

      if (userData) {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        socketService.connect();
      }
    } catch (e) {
      console.error('Failed to load initial state', e);
    } finally {
      setIsLoading(false);
    }
  }

  const login = async (userData: any, token: string) => {
    setUser(userData);
    await AsyncStorage.setItem('user_token', token);
    await AsyncStorage.setItem('user_data', JSON.stringify(userData));
    await socketService.connect();
  };

  const register = async (userData: any, token: string) => {
    setUser(userData);
    await AsyncStorage.setItem('user_token', token);
    await AsyncStorage.setItem('user_data', JSON.stringify(userData));
    await socketService.connect();
  };

  const logout = async () => {
    setUser(null);
    await AsyncStorage.removeItem('user_token');
    await AsyncStorage.removeItem('user_data');
    socketService.disconnect();
    router.replace('/(auth)/login');
  };

  const finishOnboarding = async (role: 'CITIZEN' | 'AGENT') => {
    setHasFinishedOnboarding(true);
    setSelectedRole(role);
    await AsyncStorage.setItem('has_finished_onboarding', 'true');
    await AsyncStorage.setItem('selected_role', role);
    router.replace('/(auth)/login');
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, hasFinishedOnboarding, selectedRole, login, register, logout, finishOnboarding }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
