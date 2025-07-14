// import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiDev from './apiDev';
import ApiEndpoints, {
  GET_CITY,
  GET_RECOMMENDED_PANDIT,
  POST_LOGOUT,
  POST_REFRESH_TOKEN,
  POST_SIGNIN,
  POST_SIGNUP,
} from './apiEndpoints';
import AppConstant from '../utils/appConstant';

// Types for dropdown data
export interface DropdownItem {
  subCastes: any[];
  id: string | number;
  name: string;
  description?: string;
}
// Types for pooja request data
export interface PoojaRequestItem {
  id: number;
  title: string;
  scheduledDate: string;
  imageUrl?: string;
  subtitle?: string;
  price?: number;
}
// Types for pooja request data
export interface AstroServiceItem {
  id: number;
  title: string;
  pricePerMin: string;
  imageUrl?: string;
  description?: string;
}

export interface ChatMessage {
  id: number;
  sender: {
    name: string;
    isUser: boolean;
  };
  text: string;
}

export interface PoojaItem {
  id: number;
  name: string;
  amount: number;
  unit: string;
}
export interface CancellationReason {
  id: number;
  reason: string;
  requiresSpecification?: boolean; // Optional, only for "Other"
}
export interface CancellationPolicy {
  id: number;
  description: string;
}
export interface PastBookingItem {
  id: number;
  poojaName: string;
  date: string; // ISO date string, e.g., "2024-09-26"
  maharajName: string;
  status: 'accepted' | 'completed' | 'cancelled' | 'rejected';
  imageUrl: string;
}

export interface PoojaBookingPlace {
  id: number;
  name: string;
}

export interface PoojaBookingAddress {
  id: number;
  title: string;
  subtitle: string;
}

export interface PoojaBookingTirthPlace {
  id: number;
  title: string;
  subtitle: string;
}

export interface HomeData {
  pandits: PanditItem[];
  puja: PujaItem[];
}
export interface PanditItem {
  id: number;
  name: string;
  image: string;
  rating: number;
}
export interface RecommendedPandit {
  id: number;
  full_name: string;
  profile_img: string;
  city: number;
}
export interface PujaItem {
  id: number;
  name: string;
  image: string;
  time: string;
}
export interface PricingOption {
  id: number;
  price: number;
  priceDes: string;
}

export interface PujaListItemType {
  id: number;
  name: string;
  pujaPurpose: string;
  price: number;
  image: string;
  description: string;
  pricing: PricingOption[];
  visualSection: string;
}

export interface RecommendedPuja {
  id: number;
  name: string;
  image: string;
  description: string;
  pujaPurpose: string;
  price: number;
  pricing: PricingOption[];
  visualSection: string;
}

export interface PujaListDataResponse {
  recommendedPuja: RecommendedPuja[];
  pujaList: PujaListItemType[];
}

export interface PanditListItem {
  id: number;
  name: string;
  location: string;
  languages: string;
  image: string;
  isSelected: boolean;
  isVerified: boolean;
}

export interface PujaItemsItem {
  id: number;
  item: string;
}

export interface CommentData {
  id: number;
  commenterName: string;
  date: string;
  star: number;
  Comment: string;
  like: number;
  disLike: number;
  image: string;
}

export interface address {
  id: string;
  name: string;
  type?: string;
  address: string;
  phone: string;
}

export interface AddressDataResponse {
  address: address[];
}
export interface UserRefreshTokenDataResponse {
  address: address[];
}

export interface NotificationData {
  id: number;
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
}

export interface TransactioData {
  id: number;
  title: string;
  amount: string;
  date: string;
  type: string;
}

export interface User {
  mobile: string;
  firebase_uid: string;
  first_name: string;
  last_name: string;
  email: string;
  role: number;
  gender: number;
  profile_img: string;
  pandit_details: string;
}

export interface location {
  latitude: number;
  longitude: number;
}

export interface SignInResponse {
  message: string;
  access_token: string;
  refresh_token: string;
  is_register: boolean;
  user: User;
  location: location;
}

export interface SignInRequest {
  mobile: string;
  firebase_uid: string;
  role: number;
}

export interface SignupRequest {
  mobile: string;
  firebase_uid: string;
  first_name: string;
  last_name: string;
  email: string;
  role: number;
  address: string;
}

export interface CreateUserResponse {
  mobile: string;
  firebase_uid: string;
  first_name: string;
  last_name: string;
  email: string;
  role: number;
  gender: number;
  profile_img: string;
  pandit_detail: string;
}

export interface CreateUserLocation {
  latitude: number;
  longitude: number;
}

export interface SignUpResponse {
  message: string;
  access_token: string;
  refresh_token: string;
  user: CreateUserResponse;
  location: CreateUserLocation;
}

export interface LogoutRequest {
  refresh_token: string;
}

export interface RefreshTokenRequest {
  refresh_token: string;
}

export const apiService = {
  // Fetch cities based on pincode
  getCities: async (pincode: string): Promise<DropdownItem[]> => {
    try {
      const response = await apiDev.get(`${ApiEndpoints.CITY_API}/${pincode}`);
      if (response.data[0].Status === 'Success') {
        const postOffices = response.data[0].PostOffice || [];
        return postOffices.map((office: any) => ({
          id: office.Name,
          name: `${office.Name}, ${office.District}, ${office.State}`,
        }));
      }
      return [];
    } catch (error) {
      console.error('Error fetching cities:', error);
      return [];
    }
  },

  // Fetch castes (mock data)
  getCastes: async (): Promise<DropdownItem[]> => {
    try {
      const response = await apiDev.get(ApiEndpoints.CASTE_API);
      return response?.data?.record || [];
    } catch (error) {
      console.error('Error fetching castes:', error);
      return [];
    }
  },

  // Fetch sub-castes based on caste
  getSubCastes: async (casteId: number): Promise<DropdownItem[]> => {
    try {
      const response = await apiDev.get(
        `${ApiEndpoints.SUB_CASTE_API}?caste=${casteId}`,
      );
      return response.data?.record || [];
    } catch (error) {
      console.error('Error fetching sub-castes:', error);
      return [];
    }
  },

  // Fetch gotras
  getGotras: async (): Promise<DropdownItem[]> => {
    try {
      const response = await apiDev.get(ApiEndpoints.GOTRA_API);
      return response.data?.record || [];
    } catch (error) {
      console.error('Error fetching gotras:', error);
      return [];
    }
  },

  // Fetch getArea
  getArea: async (): Promise<DropdownItem[]> => {
    try {
      const response = await apiDev.get(ApiEndpoints.AREA_API);
      return response.data?.record || [];
    } catch (error) {
      console.error('Error fetching gotras:', error);
      return [];
    }
  },

  // Fetch getPoojaPerformed
  getPoojaPerformed: async (): Promise<DropdownItem[]> => {
    try {
      const response = await apiDev.get(ApiEndpoints.POOJA_PERFORMED_API);
      return response.data?.record || [];
    } catch (error) {
      console.error('Error fetching gotras:', error);
      return [];
    }
  },

  // Fetch getPoojaPerformed
  getAstrologyConsulationPerformed: async (): Promise<DropdownItem[]> => {
    try {
      const response = await apiDev.get(
        ApiEndpoints.ASTROLOGY_CONSLATION_PERFORMED_API,
      );
      return response.data?.record || [];
    } catch (error) {
      console.error('Error fetching gotras:', error);
      return [];
    }
  },
  // Fetch getLanguages
  getLanguages: async (): Promise<DropdownItem[]> => {
    try {
      const response = await apiDev.get(ApiEndpoints.LANGUAGES_API);
      return response.data?.record || [];
    } catch (error) {
      console.error('Error fetching gotras:', error);
      return [];
    }
  },
  // Fetch poojaRequests
  getPoojaRequests: async (): Promise<PoojaRequestItem[]> => {
    try {
      const response = await apiDev.get(ApiEndpoints.POOJA_REQUESTS_API);
      return response.data?.record || [];
    } catch (error) {
      console.error('Error fetching pooja requests:', error);
      return [];
    }
  },
  // Fetch getAstroServices
  getAstroServices: async (): Promise<AstroServiceItem[]> => {
    try {
      const response = await apiDev.get(ApiEndpoints.ASTRO_SERVICES_API);
      return response.data?.record || [];
    } catch (error) {
      console.error('Error fetching astro services:', error);
      return [];
    }
  },
  // Fetch getMessages
  getMessages: async (): Promise<ChatMessage[]> => {
    try {
      const response = await apiDev.get(ApiEndpoints.MESSAGES_API);
      return response.data?.record || [];
    } catch (error) {
      console.error('Error fetching messages:', error);
      return [];
    }
  },
  // Fetch getPoojaItems
  getPoojaItems: async (): Promise<PoojaItem[]> => {
    try {
      const response = await apiDev.get(ApiEndpoints.POOJA_ITEMS_API);
      return response.data?.record || [];
    } catch (error) {
      console.error('Error fetching pooja items:', error);
      return [];
    }
  },
  getCancellationReason: async (): Promise<CancellationReason[]> => {
    try {
      const response = await apiDev.get(ApiEndpoints.CANCELLATION_REASON_API);
      return response.data?.record || [];
    } catch (error) {
      console.error('Error fetching cancellation reasons:', error);
      return [];
    }
  },
  getCancellationPolicy: async (): Promise<CancellationPolicy[]> => {
    try {
      const response = await apiDev.get(ApiEndpoints.CANCELLATION_POLICY_API);
      return response.data?.record || [];
    } catch (error) {
      console.error('Error fetching cancellation policies:', error);
      return [];
    }
  },
  getPastBookings: async (): Promise<PastBookingItem[]> => {
    try {
      const response = await apiDev.get(ApiEndpoints.PAST_BOOKINGS_API);
      return response.data?.record || [];
    } catch (error) {
      console.error('Error fetching past bookings :', error);
      return [];
    }
  },

  getBookingPlaces: async (): Promise<PoojaBookingPlace[]> => {
    try {
      const response = await apiDev.get(ApiEndpoints.POOJA_BOOKING_PLACE_API);
      return response.data?.record || [];
    } catch (error) {
      console.error('Error fetching get booking places :', error);
      return [];
    }
  },

  getBookingAddress: async (): Promise<PoojaBookingAddress[]> => {
    try {
      const response = await apiDev.get(ApiEndpoints.POOJA_ADDRESS_PLACE_API);
      return response.data?.record || [];
    } catch (error) {
      console.error('Error fetching get booking address :', error);
      return [];
    }
  },

  getBookingTirthPlaces: async (): Promise<PoojaBookingTirthPlace[]> => {
    try {
      const response = await apiDev.get(ApiEndpoints.POOJA_TIRTH_PLACE_API);
      return response.data?.record || [];
    } catch (error) {
      console.error('Error fetching get booking tirth places :', error);
      return [];
    }
  },

  getPanditAndPujaData: async (): Promise<HomeData> => {
    try {
      const response = await apiDev.get(ApiEndpoints.HOME_DATA_API);
      return response.data?.record || [];
    } catch (error) {
      console.error('Error fetching past bookings :', error);
      return {pandits: [], puja: []};
    }
  },
  getPujaListData: async (): Promise<PujaListDataResponse> => {
    try {
      const response = await apiDev.get(ApiEndpoints.PUJA_LIST_API);
      return response.data?.record || {recommendedPuja: [], pujaList: []};
    } catch (error) {
      console.error('Error fetching puja list data:', error);
      return {recommendedPuja: [], pujaList: []};
    }
  },
  getPanditListData: async (): Promise<PanditListItem[]> => {
    try {
      const response = await apiDev.get(ApiEndpoints.PANDIT_LIST_API);
      return response.data?.record || [];
    } catch (error) {
      console.error('Error fetching past bookings :', error);
      return [];
    }
  },
  getPujaItemsData: async (): Promise<PujaItemsItem[]> => {
    try {
      const response = await apiDev.get(ApiEndpoints.PUJA_ITEMS_API);
      return response.data?.record || [];
    } catch (error) {
      console.error('Error fetching past bookings :', error);
      return [];
    }
  },
  getCommentData: async (): Promise<CommentData[]> => {
    try {
      const response = await apiDev.get(ApiEndpoints.COMMENT_DATA_API);
      return response.data?.record || [];
    } catch (error) {
      console.error('Error fetching past bookings :', error);
      return [];
    }
  },
  getNotificationData: async (): Promise<NotificationData[]> => {
    try {
      const response = await apiDev.get(ApiEndpoints.NOTIFICATION_DATA_API);
      return response.data?.record || [];
    } catch (error) {
      console.error('Error fetching past bookings :', error);
      return [];
    }
  },
  getTransactionData: async (): Promise<TransactioData[]> => {
    try {
      const response = await apiDev.get(ApiEndpoints.TRANSACTION_DATA_API);
      return response.data?.record || [];
    } catch (error) {
      console.error('Error fetching past bookings :', error);
      return [];
    }
  },
  getAddressData: async (): Promise<AddressDataResponse> => {
    try {
      const response = await apiDev.get(ApiEndpoints.ADDRESS_DATA_API);
      return response.data?.record || {address: []};
    } catch (error) {
      console.error('Error fetching address data:', error);
      return {address: []};
    }
  },
  postUserRefreshTokenApi: async (): Promise<UserRefreshTokenDataResponse> => {
    console.log(
      '---refreshing----apiConversation--1-postUserRefreshTokenApi-1',
    );
    let refreshToken = await AsyncStorage.getItem(AppConstant.REFRESH_TOKEN); // retrieve the refresh token
    // This is testing refresh token to handle 403 ( Refresh token expired )
    // refreshToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJlY2QxOTIyMC04NmZkLTExZWYtOTQwOS03YmY0Y2VlYWU3MWUiLCJlbnYiOiJERVYiLCJjcmVhdGVkRGF0ZSI6MTcyODU2MTA2MzA1MCwiaWF0IjoxNzI4NTYxMDYzLCJleHAiOjE3Mjg2NDc0NjN9.GMBBfjsygnWrXa_mxyUc-SflGBaP0oBUn1ENHjXi2nc";
    console.log(
      '---refreshing----apiConversation--1-postUserRefreshTokenApi-2',
    );
    const rawData: any = {
      data: {
        refreshToken: refreshToken,
      },
    };
    console.log(
      '---refreshing----apiConversation--1-postUserRefreshTokenApi-3 : rawData : ',
      rawData,
    );
    let apiUrl = ApiEndpoints.REFRESH_TOKEN_API;
    console.log(
      '---refreshing----apiConversation--1-postUserRefreshTokenApi-4',
    );
    try {
      const response = await apiDev.post(apiUrl, rawData);
      return response.data?.record || {address: []};
    } catch (error) {
      console.error('Error fetching address data:', error);
      return {address: []};
    }
  },
};

export const postSignIn = (data: SignInRequest): Promise<SignInResponse> => {
  console.log('params data ::', data);
  let apiUrl = POST_SIGNIN;
  return new Promise((resolve, reject) => {
    apiDev
      .post(apiUrl, data)
      .then(response => {
        resolve(response.data);
      })
      .catch(error => {
        console.error('Error fetching sign in data:', error);
        reject(error);
      });
  });
};

export const postSignUp = (data: SignupRequest): Promise<SignUpResponse> => {
  console.log('params data ::', data);
  let apiUrl = POST_SIGNUP;
  return new Promise((resolve, reject) => {
    apiDev
      .postForm(apiUrl, data)
      .then(response => {
        resolve(response.data);
      })
      .catch(error => {
        console.error('Error fetching sign up data:', JSON.stringify(error));
        reject(error);
      });
  });
};

export const getCity = () => {
  let apiUrl = GET_CITY;
  return new Promise((resolve, reject) => {
    apiDev
      .get(apiUrl)
      .then(response => {
        resolve(response.data);
      })
      .catch(error => {
        console.error('Error fetching city data:', error);
        reject(error);
      });
  });
};

export const postLogout = (data: LogoutRequest) => {
  let apiUrl = POST_LOGOUT;
  return new Promise((resolve, reject) => {
    apiDev
      .post(apiUrl, data)
      .then(response => {
        resolve(response);
      })
      .catch(error => {
        console.error('Error logout', error);
        reject(error);
      });
  });
};

export const postRefreshToken = (data: RefreshTokenRequest) => {
  let apiUrl = POST_REFRESH_TOKEN;
  return new Promise((resolve, reject) => {
    apiDev
      .post(apiUrl, data)
      .then(response => {
        resolve(response);
      })
      .catch(error => {
        console.error('Error refreshing token', error);
        reject(error);
      });
  });
};

export const getRecommendedPandit = (
  latitude: string,
  longitude: string,
): Promise<any> => {
  const apiUrl = GET_RECOMMENDED_PANDIT.replace('{latitude}', latitude).replace(
    '{longitude}',
    longitude,
  );
  return new Promise((resolve, reject) => {
    apiDev
      .get(apiUrl)
      .then(response => {
        resolve(response.data);
      })
      .catch(error => {
        console.error('Error fetching recommended pandit:', error);
        reject(error);
      });
  });
};
