import React, {useEffect} from 'react';
import {useGPS} from '../provider/GPSProvider';

const GPSCheckWrapper: React.FC = () => {
  const {isGPSEnabled, isLocationPermissionGranted, isLoading, promptForGPS} =
    useGPS();
  const [hasPrompted, setHasPrompted] = React.useState(false);

  useEffect(() => {
    // Auto-prompt for GPS if disabled OR permission not granted (only once)
    if (
      !isLoading &&
      !hasPrompted &&
      (!isLocationPermissionGranted || !isGPSEnabled)
    ) {
      setHasPrompted(true);
      promptForGPS();
    }

    // Reset prompt flag when GPS becomes enabled
    if (
      !isLoading &&
      isLocationPermissionGranted &&
      isGPSEnabled &&
      hasPrompted
    ) {
      setHasPrompted(false);
    }
  }, [
    isGPSEnabled,
    isLocationPermissionGranted,
    isLoading,
    promptForGPS,
    hasPrompted,
  ]);

  return null;
};

export default GPSCheckWrapper;
