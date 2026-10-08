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
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';
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
  isLocationServiceEnabled: boolean;
  refreshLocation: () => Promise<void>;
  openLocationSettings: (target?: 'app' | 'device') => Promise<void>;
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
  const [isLocationServiceEnabled, setIsLocationServiceEnabled] =
    useState<boolean>(true);

  /**
   * Checks current permission status without prompting user.
   */
  const checkLocationPermissionOnly = async (): Promise<
    LocationContextType['permissionStatus']
  > => {
    if (Platform.OS === 'ios') {
      try {
        const authResult = await Geolocation.requestAuthorization('whenInUse');
        console.log(
          '📱 [Location Debug] AppState check - Geolocation.requestAuthorization:',
          authResult,
        );
        if (authResult === 'disabled') {
          return 'unavailable';
        }
        const status = await check(PERMISSIONS.IOS.LOCATION_WHEN_IN_USE);
        console.log(
          '📱 [Location Debug] AppState check - react-native-permissions check:',
          status,
        );
        return status;
      } catch (e) {
        console.warn('📱 [Location Debug] checkLocationPermissionOnly error:', e);
        return 'undetermined';
      }
    }
    try {
      const fine = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      );
      const coarse = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
      );
      const res = fine || coarse ? 'granted' : 'denied';
      console.log(
        '🤖 [Location Debug] AppState check - Android permissions:',
        res,
      );
      return res;
    } catch {
      return 'undetermined';
    }
  };

  /**
   * Requests location permission.
   * @returns Whether permission was granted.
   */
  const requestLocationPermission = async (): Promise<
    LocationContextType['permissionStatus']
  > => {
    if (Platform.OS === 'ios') {
      // First check if phone global location service is disabled
      try {
        const authResult = await Geolocation.requestAuthorization('whenInUse');
        console.log(
          '📱 [Location Debug] iOS Geolocation.requestAuthorization result:',
          authResult,
        );
        if (authResult === 'disabled') {
          setIsLocationServiceEnabled(false);
          return 'unavailable';
        }
      } catch (err) {
        console.warn(
          '📱 [Location Debug] iOS Geolocation.requestAuthorization err:',
          err,
        );
      }

      const status = await request(PERMISSIONS.IOS.LOCATION_WHEN_IN_USE);
      console.log(
        '📱 [Location Debug] iOS react-native-permissions request status:',
        status,
      );
      return status;
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

      console.log('🤖 [Location Debug] Android Permissions.requestMultiple:', {
        fine,
        coarse,
      });

      if (
        fine === PermissionsAndroid.RESULTS.GRANTED ||
        coarse === PermissionsAndroid.RESULTS.GRANTED
      ) {
        return 'granted';
      }

      if (
        fine === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN ||
        coarse === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN
      ) {
        return 'blocked';
      }

      return 'denied';
    } catch (err) {
      console.warn('🤖 [Location Debug] Android permission request error:', err);
      return 'denied';
    }
  };

  /* Simplifies GPS service check */
  const ensureLocationServicesEnabled = async (): Promise<boolean> => {
    if (Platform.OS === 'ios') {
      try {
        const authResult = await Geolocation.requestAuthorization('whenInUse');
        console.log(
          '📱 [Location Debug] ensureLocationServicesEnabled (iOS):',
          authResult,
        );
        return authResult !== 'disabled';
      } catch (err) {
        console.warn('📱 [Location Debug] iOS ensureLocationServicesEnabled error:', err);
        return false;
      }
    }
    // Android
    try {
      const result = await promptForEnableLocationIfNeeded({
        interval: 10000,
        waitForAccurate: false,
      });
      console.log(
        '🤖 [Location Debug] ensureLocationServicesEnabled (Android):',
        result,
      );
      return result === 'enabled' || result === 'already-enabled';
    } catch (err) {
      console.warn('🤖 [Location Debug] Android promptForEnableLocationIfNeeded err:', err);
      return false;
    }
  };

  /* Streamlined location fetch with single timeout */
  const getLocationWithFallback = (): Promise<LocationData> => {
    return new Promise((resolve, reject) => {
      Geolocation.getCurrentPosition(
        pos => {
          console.log('✅ [Location Debug] Coordinates received:', {
            lat: pos.coords.latitude,
            lon: pos.coords.longitude,
          });
          resolve({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            timestamp: new Date(pos.timestamp).toISOString(),
          });
        },
        err => {
          console.warn(
            '❌ [Location Debug] Geolocation.getCurrentPosition failed:',
            err,
          );
          if (
            err.code === 2 ||
            err.message?.toLowerCase().includes('turned off') ||
            err.message?.toLowerCase().includes('disabled')
          ) {
            setIsLocationServiceEnabled(false);
            setPermissionStatus('unavailable');
          }
          reject(err);
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 },
      );
    });
  };

  /*
   * Opens settings appropriately for app permissions vs device GPS.
   */
  const openLocationSettings = async (
    target: 'app' | 'device' = 'app',
  ): Promise<void> => {
    if (Platform.OS === 'android' && target === 'device') {
      try {
        await Linking.sendIntent('android.settings.LOCATION_SOURCE_SETTINGS');
        return;
      } catch (err) {
        console.warn('Failed to open Android location source settings:', err);
      }
    }
    try {
      await Linking.openSettings();
    } catch (err) {
      console.warn('Failed to open app settings:', err);
    }
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
      const status = await requestLocationPermission();
      console.log('📍 [Location Debug] Permission status resolved:', status);
      setPermissionStatus(status);

      if (status === 'unavailable') {
        setIsLocationServiceEnabled(false);
        if (!backgroundUpdate) setLoading(false);
        return null;
      }

      if (status !== 'granted' && status !== 'limited') {
        if (!backgroundUpdate) setLoading(false);
        return null; // Permission denied or blocked
      }

      // 2. Services (GPS / iOS Master Switch)
      const servicesEnabled = await ensureLocationServicesEnabled();
      console.log(
        '📍 [Location Debug] Location Services enabled result:',
        servicesEnabled,
      );
      setIsLocationServiceEnabled(servicesEnabled);
      if (!servicesEnabled) {
        setPermissionStatus('unavailable');
        if (!backgroundUpdate) setLoading(false);
        return null;
      }

      // 3. Fetch Coordinates
      const freshLoc = await getLocationWithFallback();
      if (freshLoc) {
        const enrichedLoc = {
          ...freshLoc,
          timestamp: new Date().toISOString(),
        };

        setLocation(enrichedLoc); // Update State
        setIsLocationServiceEnabled(true);
        return enrichedLoc;
      }
    } catch (err: any) {
      console.warn('❌ [Location Debug] fetchCurrentLocation error:', err);
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
    const subscription = AppState.addEventListener('change', async nextAppState => {
      if (nextAppState === 'active') {
        console.log(
          '🔄 [Location] App Foregrounded. Checking permission status...',
        );
        const currentPerm = await checkLocationPermissionOnly();
        setPermissionStatus(currentPerm);

        if (currentPerm === 'granted' || currentPerm === 'limited') {
          await fetchCurrentLocation(true);
        } else if (currentPerm === 'unavailable') {
          setIsLocationServiceEnabled(false);
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
        isLocationServiceEnabled,
        refreshLocation: async () => {
          await fetchCurrentLocation(false);
        }, // Manual Force Refresh
        openLocationSettings,
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
