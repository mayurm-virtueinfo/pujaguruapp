import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  ReactNode,
} from 'react';
import {
  AppState,
  Platform,
  Alert,
  Linking,
  PermissionsAndroid,
} from 'react-native';
import Geolocation from 'react-native-geolocation-service';
import { request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import { promptForEnableLocationIfNeeded } from 'react-native-android-location-enabler';

export interface LocationData {
  latitude: number;
  longitude: number;
  address?: string;
  timestamp?: string;
}

interface LocationContextType {
  location: LocationData | null;
  loading: boolean;
  error: string | null;
  permissionStatus:
    | 'granted'
    | 'denied'
    | 'blocked'
    | 'unavailable'
    | 'limited'
    | 'undetermined';
  refreshLocation: () => Promise<void>;
}

const LocationContext = createContext<LocationContextType | undefined>(
  undefined,
);

export const LocationProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<
    | 'granted'
    | 'denied'
    | 'blocked'
    | 'unavailable'
    | 'limited'
    | 'undetermined'
  >('undetermined');

  /**
   * Requests location permission.
   * @returns Whether permission was granted.
   */
  /* Simplifies permission requests */
  const requestLocationPermission = async (): Promise<boolean> => {
    if (Platform.OS === 'ios') {
      const status = await request(PERMISSIONS.IOS.LOCATION_WHEN_IN_USE);
      return status === RESULTS.GRANTED || status === RESULTS.LIMITED;
    }
    // Android
    try {
      const granted = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
      ]);
      const fine = granted[PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION];
      const coarse =
        granted[PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION];
      if (
        fine === PermissionsAndroid.RESULTS.GRANTED ||
        coarse === PermissionsAndroid.RESULTS.GRANTED
      ) {
        return true;
      }
      // Permission permanently denied - PermissionDeniedView will handle UI
      return false;
    } catch (err) {
      console.warn(err);
      return false;
    }
  };

  /* Simplifies GPS service check */
  const ensureLocationServicesEnabled = async (): Promise<boolean> => {
    if (Platform.OS !== 'android') return true;
    try {
      const result = await promptForEnableLocationIfNeeded({
        interval: 10000,
        waitForAccurate: false,
      });
      return result === 'enabled' || result === 'already-enabled';
    } catch {
      return false;
    }
  };

  /* Streamlined location fetch with single timeout */
  const getLocationWithFallback = (): Promise<LocationData> => {
    return new Promise((resolve, reject) => {
      Geolocation.getCurrentPosition(
        pos =>
          resolve({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            timestamp: new Date(pos.timestamp).toISOString(),
          }),
        err => reject(err),
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 },
      );
    });
  };

  /*
   * Fetches the current location.
   * @param backgroundUpdate Whether to update in the background.
   * @returns The current location.
   */
  const fetchCurrentLocation = async (
    backgroundUpdate = false,
  ): Promise<LocationData | null> => {
    try {
      if (!backgroundUpdate) setLoading(true);
      setError(null);

      // 1. Permission
      const hasPermission = await requestLocationPermission();
      if (!hasPermission) {
        setPermissionStatus('denied');
        if (!backgroundUpdate) setLoading(false);
        return null; // Permission denied
      }
      setPermissionStatus('granted');

      // 2. Services (GPS)
      const gpsEnabled = await ensureLocationServicesEnabled();
      if (!gpsEnabled && Platform.OS === 'android') {
        if (!backgroundUpdate) setLoading(false);
        return null;
      }

      // 3. Fetch
      const freshLoc = await getLocationWithFallback();
      if (freshLoc) {
        const enrichedLoc = {
          ...freshLoc,
          timestamp: new Date().toISOString(),
        };

        setLocation(enrichedLoc); // Update State
        // Cache code removed
        return enrichedLoc;
      }
    } catch (err: any) {
      console.warn('fetchCurrentLocation failed:', err);
      setError(err.message || 'Failed to fetch location');
    } finally {
      if (!backgroundUpdate) setLoading(false);
    }
    return null;
  };

  /**
   * Main strategy: Always fetch fresh location (Cache removed)
   */
  const loadLocation = async () => {
    setLoading(true);
    try {
      console.log('📍 [Location] Fetching fresh GPS location...');
      await fetchCurrentLocation(false);
    } catch (e) {
      console.error('Error loading location logic:', e);
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLocation();

    // AppState listener to refresh on foreground
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (nextAppState === 'active') {
        console.log(
          '🔄 [Location] App Foregrounded. Checking permission status...',
        );
        // Only auto-refresh if permission is already granted
        // This prevents infinite loop when returning from settings with permission denied
        if (permissionStatus === 'granted') {
          loadLocation();
        }
      }
    });

    return () => {
      subscription.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on mount

  return (
    <LocationContext.Provider
      value={{
        location,
        loading,
        error,
        permissionStatus,
        refreshLocation: async () => {
          await fetchCurrentLocation(false);
        }, // Manual Force Refresh
      }}
    >
      {children}
    </LocationContext.Provider>
  );
};

export const useLocation = (): LocationContextType => {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
};
