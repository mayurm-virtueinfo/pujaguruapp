import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import {AppState, AppStateStatus} from 'react-native';
import {
  checkAndPromptGPS,
  isGPSEnabled as checkGPSEnabled,
  requestLocationPermission,
} from '../utils/locationUtils';

interface GPSContextType {
  isGPSEnabled: boolean;
  isLocationPermissionGranted: boolean;
  checkGPSStatus: () => Promise<void>;
  promptForGPS: () => Promise<boolean>;
  isLoading: boolean;
}

const GPSContext = createContext<GPSContextType | undefined>(undefined);

interface GPSProviderProps {
  children: ReactNode;
}

export const GPSProvider: React.FC<GPSProviderProps> = ({children}) => {
  const [isGPSEnabled, setIsGPSEnabled] = useState<boolean>(false);
  const [isLocationPermissionGranted, setIsLocationPermissionGranted] =
    useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const checkGPSStatus = async () => {
    try {
      setIsLoading(true);

      // Check location permission first
      const hasPermission = await requestLocationPermission();
      setIsLocationPermissionGranted(hasPermission);

      if (hasPermission) {
        // Check if GPS is enabled
        const gpsEnabled = await checkGPSEnabled();
        setIsGPSEnabled(gpsEnabled);
      } else {
        setIsGPSEnabled(false);
      }
    } catch (error) {
      console.error('Error checking GPS status:', error);
      setIsGPSEnabled(false);
      setIsLocationPermissionGranted(false);
    } finally {
      setIsLoading(false);
    }
  };

  const promptForGPS = async (): Promise<boolean> => {
    try {
      setIsLoading(true);
      const gpsEnabled = await checkAndPromptGPS();
      setIsGPSEnabled(gpsEnabled);

      setTimeout(() => {
        checkGPSStatus();
      }, 1000);

      return gpsEnabled;
    } catch (error) {
      console.error('Error prompting for GPS:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkGPSStatus();

    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        checkGPSStatus();
      }
    };

    const subscription = AppState.addEventListener(
      'change',
      handleAppStateChange,
    );

    return () => {
      subscription?.remove();
    };
  }, []);

  const contextValue: GPSContextType = {
    isGPSEnabled,
    isLocationPermissionGranted,
    checkGPSStatus,
    promptForGPS,
    isLoading,
  };

  return (
    <GPSContext.Provider value={contextValue}>{children}</GPSContext.Provider>
  );
};

export const useGPS = (): GPSContextType => {
  const context = useContext(GPSContext);
  if (context === undefined) {
    throw new Error('useGPS must be used within a GPSProvider');
  }
  return context;
};
