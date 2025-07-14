import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ApiEndpoints from './apiEndpoints';
import {apiService, postRefreshToken} from './apiService';
import AppConstant from '../utils/appConstant';

// Create an axios instance

const apiDev = axios.create({
  // baseURL: Config.BASE_URL,
  baseURL: 'https://2d5129cf14ce.ngrok-free.app',
  // baseURL: ApiEndpoints.BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});
// Request interceptors
apiDev.interceptors.request.use(
  async config => {
    const token = await AsyncStorage.getItem(AppConstant.ACCESS_TOKEN);
    console.log('Access token :: ', token);

    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    config.headers['X-Master-Key'] = ApiEndpoints.XMasterKey;
    console.log('------------------------------------------------');
    console.log('------------apiDev-config-------------');
    console.log('------------------------------------------------');
    console.log('BaseUrl : ', config.baseURL);
    console.log('Url : ', config.url);
    console.log('Headers : ', config.headers);
    console.log('------------------------------------------------');
    return config;
  },
  error => {
    return Promise.reject(error);
  },
);

let isRefreshing = false;
let refreshSubscribers: any = [];

const subscribeTokenRefresh = (cb: any) => {
  refreshSubscribers.push(cb);
};

const onRefreshed = (newAccessToken: string) => {
  refreshSubscribers.map((cb: any) => cb(newAccessToken));
};

apiDev.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      if (!isRefreshing) {
        isRefreshing = true;
        const refresh_token = await AsyncStorage.getItem(
          AppConstant.REFRESH_TOKEN,
        );
        const params = {
          refresh_token: refresh_token || '',
        };
        isRefreshing = true;
        console.log('---Accesstoken---refreshing---apiDev');
        try {
          console.log('---refreshing----apiDev-1');
          const response: any = await postRefreshToken(params);
          console.log('---refreshing----apiDev-2 : ', response);
          const tokens = response?.data?.access_token;
          console.log('---refreshing----apiDev-3 : ');
          // const newAccessToken = tokens.accessToken;
          // const newRefreshToken = tokens.refreshToken;
          await AsyncStorage.setItem(AppConstant.ACCESS_TOKEN, tokens);
          // await AsyncStorage.setItem(
          //   AppConstant.REFRESH_TOKEN,
          //   newRefreshToken,
          // );
          console.log('---refreshing----apiDev-4');
          isRefreshing = false;
          onRefreshed(tokens);
          console.log('---refreshing----apiDev-5');
          // Retry the original request with the new token
          console.log('---Accesstoken---refreshing---apiDev-done-success');
          return apiDev(originalRequest);
        } catch (error: any) {
          // Need to apply this code if neccesary
          // setTimeout(() => {
          //   signOutAp();
          // }, 500);
          isRefreshing = false;
          // if (error.status == 403) {
          //   console.log("Refresh token has expired : Please redirect to login");

          //   try {
          //     clearAsyncStorageExceptKey("isOnboarding");
          //   } catch (error: any) {
          //     console.log("Logout Error AsyncStorage : ", error.toString());
          //   }

          //   try {
          //     await GoogleSignin.revokeAccess();
          //     await GoogleSignin.signOut();
          //   } catch (error: any) {
          //     console.log("Logout Error Google : ", error.toString());
          //   }

          //   navigateToLoginScreen();
          // }
          console.log(
            '---Accesstoken---refreshing---apiDev--failure : ',
            error,
          );
          // Handle refresh token failure (e.g., log out the user)
          return Promise.reject(error);
        }
      }

      return new Promise(resolve => {
        subscribeTokenRefresh(async (newAccessToken: string) => {
          // const userId = await AsyncStorage.getItem(USER_DATA_KEY.userId);
          // originalRequest.headers['Content-Type'] = 'multipart/form-data';
          // originalRequest.headers['Accept'] = 'application/json';
          originalRequest.headers['x-access-token'] = `${newAccessToken}`;
          // originalRequest.headers['x-user-id'] = `${userId}`;
          resolve(apiDev(originalRequest));
        });
      });
    }

    return Promise.reject(error);
  },
);

export default apiDev;
