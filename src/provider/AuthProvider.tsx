import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react';
import {
  getAuth,
  onAuthStateChanged,
  signOut,
} from '@react-native-firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AppConstant from '../utils/appConstant';

interface AuthContextType {
  isAuthenticated: boolean;
  signIn: (token: string) => Promise<void>;
  signOutApp: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({children}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async user => {
      try {
        if (user) {
          const token = await AsyncStorage.getItem(AppConstant.ACCESS_TOKEN);
          setIsAuthenticated(!!token);
        } else {
          await AsyncStorage.removeItem(AppConstant.ACCESS_TOKEN);
          await AsyncStorage.removeItem(AppConstant.REFRESH_TOKEN);
          await AsyncStorage.removeItem(AppConstant.FIREBASE_UID);
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('Error checking authentication status:', error);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const signIn = async (token: string) => {
    try {
      await AsyncStorage.setItem(AppConstant.ACCESS_TOKEN, token);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Sign in error:', error);
    }
  };

  const signOutApp = async () => {
    try {
      const auth = getAuth();
      await signOut(auth);
      await AsyncStorage.removeItem(AppConstant.ACCESS_TOKEN);
      await AsyncStorage.removeItem(AppConstant.REFRESH_TOKEN);
      await AsyncStorage.removeItem(AppConstant.FIREBASE_UID);
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  return (
    <AuthContext.Provider value={{isAuthenticated, signIn, signOutApp}}>
      {isLoading ? null : children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
