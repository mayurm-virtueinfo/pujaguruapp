// import React, {
//   createContext,
//   ReactNode,
//   useContext,
//   useEffect,
//   useState,
// } from 'react';
// import {
//   getAuth,
//   onAuthStateChanged,
//   signOut,
// } from '@react-native-firebase/auth';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import AppConstant from '../utils/appConstant';

// interface AuthContextType {
//   isAuthenticated: boolean;
//   signIn: () => void;
//   signOutApp: () => void;
// }

// const AuthContext = createContext<AuthContextType | undefined>(undefined);

// interface AuthProviderProps {
//   children: ReactNode;
// }

// export const AuthProvider: React.FC<AuthProviderProps> = ({children}) => {
//   const [isAuthenticated, setIsAuthenticated] = useState(false);

//   useEffect(() => {
//     const getAccessToken = async () => {
//       try {
//         const token = await AsyncStorage.getItem(AppConstant.ACCESS_TOKEN);
//         setIsAuthenticated(!!token);
//       } catch (error) {
//         console.error('Error checking authentication status:', error);
//       }
//     };
//     getAccessToken();
//   }, [isAuthenticated]);

//   // useEffect(() => {
//   //   const auth = getAuth();
//   //   const unsubscribe = onAuthStateChanged(auth, user => {
//   //     setIsAuthenticated(!!user);
//   //   });
//   //   return () => unsubscribe();
//   // }, []);

//   const signIn = () => {
//     setIsAuthenticated(true);
//   };

//   const signOutApp = async () => {
//     try {
//       await signOut(getAuth());
//       await AsyncStorage.removeItem(AppConstant.ACCESS_TOKEN);
//       await AsyncStorage.removeItem(AppConstant.REFRESH_TOKEN);
//     } catch (error) {
//       console.error('Sign out error:', error);
//     }
//   };

//   return (
//     <AuthContext.Provider value={{isAuthenticated, signIn, signOutApp}}>
//       {children}
//     </AuthContext.Provider>
//   );
// };

// export const useAuth = () => {
//   const context = useContext(AuthContext);
//   if (!context) {
//     throw new Error('useAuth must be used within an AuthProvider');
//   }
//   return context;
// };

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

  // Check Firebase auth state and AsyncStorage token on mount
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async user => {
      try {
        if (user) {
          // User is signed in with Firebase
          const token = await AsyncStorage.getItem(AppConstant.ACCESS_TOKEN);
          setIsAuthenticated(!!token); // Sync with AsyncStorage token
        } else {
          // No user signed in
          await AsyncStorage.removeItem(AppConstant.ACCESS_TOKEN);
          await AsyncStorage.removeItem(AppConstant.REFRESH_TOKEN);
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('Error checking authentication status:', error);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false); // Mark loading as complete
      }
    });

    return () => unsubscribe(); // Cleanup subscription on unmount
  }, []); // Empty dependency array to run only on mount

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
