// import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiDev from './apiDev';
import EventSource from 'react-native-sse';
import ApiEndpoints, {
  APP_URL,
  GET_AI_HISTORY,
  GET_ADDRESS_TYPE,
  GET_CITY,
  GET_MUHRAT,
  GET_PUJALIST,
  GET_RECOMMENDED_PANDIT,
  GET_USER_ADDRESS,
  POST_ADD_ADDRESS,
  GET_TIRTH_PLACE,
  POST_LOGOUT,
  POST_REFRESH_TOKEN,
  POST_SIGNIN,
  POST_SIGNUP,
  GET_ADDRESS,
  GET_POOJA_DETAILS,
  POST_BOOKING,
  GET_AUTO_MANUAL_PANDIT_SELECTION,
  GET_ALL_PANDIT_LIST,
  GET_PANDIT_DETAILS,
  GET_ADDRESS_TYPE_FOR_BOOKING,
  POST_CREATE_RAZORPAY_ORDER,
  POST_VERIFY_PAYMENT,
  POST_RATE_PANDIT,
  GET_UPCOMING_PUJA_DETAILS,
  GET_UPCOMING_PUJA,
  GET_WALLET,
  GET_TRANSACTION,
  POST_CANCEL_BOOKING,
  GET_IN_PROGRESS,
  GET_EDIT_PROFILE,
  PUT_EDIT_PROFILE,
  POST_START_CHAT,
  GET_CHAT_MESSAGES,
  GET_PAST_BOOKINGS,
  POST_REGISTER_FCM,
  GET_STATE,
  GET_OLD_CITY_API,
  POST_REVIEW_IMAGES,
  GET_PANDIT_PUJA_LIST,
  GET_POOJA_DETAIL_FOR_PUJA_LIST,
  GET_PANDIT_AVAILABILITY,
  POST_AUTO_BOOKING,
  GET_ACTIVE_PUJA,
  GET_NEW_PANDITJI,
  POST_NEW_PANDITJI_OFFER,
  GET_PLATFORM_DETAILS,
  GET_PANCHANG,
  POST_DELETE_ACCOUNT,
  GET_TERMS_AND_CONDITIONS,
  GET_USER_AGREEMENT,
  GET_REFUND_POLICY,
  POST_CREATE_MEETING,
  UPDATE_WAITING_USER,
  GET_DYNAMIC_HOURS,
  GET_CALENDAR_GRID,
  GET_DAY_DETAILS,
  CREATE_KUNDLI,
  GET_KUNDLI_LIST,
  GET_KUNDLI_DETAILS,
  GET_DAILY_HOROSCOPE,
  POST_AI_STREAM,
  GET_AI_HEALTH,
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
  name: string;
  description: string;
  user_address_id?: number;
  address_line1: string;
  address_line2: string;
  full_address: string;
}

export interface PoojaBookingTirthPlace {
  id: number;
  city: number;
  city_name: string;
  description: string;
  latitude: string;
  longitude: string;
  name: string;
  is_enabled: boolean;
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
  pandit_id: number;
  full_name: string;
  profile_img: string;
  city: number;
}
export interface PujaItem {
  id: number;
  pooja_name: string;
  pooja_image_url: string;
  when_is_pooja: string;
  booking_date: string;
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
  puja_name: string;
  amount: string;
  timestamp: string;
  booking: string;
  notes: string;
  reason: string;
  transaction_type: string;
  wallet: string;
}

export interface User {
  id: string;
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

export interface PanchangResponse {
  success: boolean;
  today_panchang: string;
  detailed_info?: {
    vaara: string;
    nakshatra: string;
    tithi: string;
    paksha: string;
    sunrise: string;
    sunset: string;
    moonrise: string;
    moonset: string;
  };
}

export interface SignInResponse {
  success: boolean;
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
  dob: string;
}

export interface CreateUserResponse {
  id: string;
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
  success: boolean;
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

export interface AddAddress {
  name: string;
  address_type: number;
  address_line1: string;
  address_line2: string;
  phone_number: string;
  city: number;
  state: string;
  pincode: string;
  latitude: number;
  longitude: number;
}

export interface deleteAddress {
  id: number;
}

export interface EditAddress {
  id: number;
  name: string;
  address_type: number;
  address_line1: string;
  address_line2: string;
  phone_number: string;
  city: number;
  state: string;
  pincode: string;
  latitude: number;
  longitude: number;
}

export interface Booking {
  pooja: string;
  pandit: number;
  samagri_required: boolean;
  address: number;
  tirth: number;
  booking_date: string;
  muhurat_type: string;
  muhurat_time: string;
  notes: string;
}

export interface CreateRazorpayOrder {
  booking_id: number;
}

export interface VerrifyPayment {
  booking_id: number;
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

export interface RatePandit {
  booking: number;
  rating: number;
  review: string;
}

export interface bookingCancellation {
  cancellation_reason_type: string;
  cancellation_reason_other?: string;
}

export interface ReviewImageUpload {
  images: {
    profile_img: {
      uri: string;
      type: string;
      name: string;
    };
  };
}

export interface DeleteAccountRequest {
  user_id: number;
}

export interface CalendarDay {
  date: string;
  day_of_week: string;
  astronomy: {
    sunrise: string;
    sunset: string;
    moonrise: string;
    moonset: string;
    moon_phase: number;
    sun_longitude: number;
    moon_longitude: number;
  };
  gujarati: {
    month_name: string;
    month_index: number;
    paksha: string;
    vikram_samvat: number;
    display_text: string;
    is_adhik: boolean;
  };
  panchang?: {
    nakshatra: {
      name: string;
      end_time: string;
    };
    yoga: {
      name: string;
      end_time: string;
    };
    karana: {
      name: string;
      end_time: string;
    };
    tithi: {
      name: string;
      end_time: string;
    };
    paksha: string;
  };
  festivals?: string[];
}

export interface HoroscopeDetailedStats {
  text: string;
  rating: number;
}

export interface HoroscopeResponse {
  date: string;
  sign: string;
  family: HoroscopeDetailedStats;
  health: HoroscopeDetailedStats;
  remedy: string;
  wealth: HoroscopeDetailedStats;
  overview: string;
  occupation: HoroscopeDetailedStats;
  lucky_stats: {
    color: string;
    number: string;
    good_time: string;
  };
}

export interface AiResponse {
  success: boolean;
  transcribed_text?: string;
  ai_response?: string;
  error?: string;
  tools_used?: {
    tool: string;
    timestamp: string;
  }[];
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
      return { pandits: [], puja: [] };
    }
  },
  getPujaListData: async (): Promise<PujaListDataResponse> => {
    try {
      const response = await apiDev.get(ApiEndpoints.PUJA_LIST_API);
      return response.data?.record || { recommendedPuja: [], pujaList: [] };
    } catch (error) {
      console.error('Error fetching puja list data:', error);
      return { recommendedPuja: [], pujaList: [] };
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
      return response.data?.record || { address: [] };
    } catch (error) {
      console.error('Error fetching address data:', error);
      return { address: [] };
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
      return response.data?.record || { address: [] };
    } catch (error) {
      console.error('Error fetching address data:', error);
      return { address: [] };
    }
  },
};

export const postSignIn = (data: SignInRequest): Promise<SignInResponse> => {
  console.log('params data ::', data);
  let apiUrl = POST_SIGNIN;
  return new Promise((resolve, reject) => {
    apiDev
      .post(apiUrl, data)
      .then((response: any) => {
        resolve(response.data);
      })
      .catch(error => {
        console.error('Error fetching sign in data:', error?.response?.data);
        reject(error);
      });
  });
};

export const getPanchang = (
  date: string,
  latitude: string,
  longitude: string,
): Promise<PanchangResponse> => {
  const apiUrl = GET_PANCHANG.replace('{date}', date)
    .replace('{latitude}', latitude)
    .replace('{longitude}', longitude);
  return new Promise((resolve, reject) => {
    apiDev
      .get(apiUrl)
      .then(response => {
        resolve(response.data as PanchangResponse);
      })
      .catch(error => {
        console.error(
          'Error fetching panchang:',
          error?.response?.data || error,
        );
        reject(error);
      });
  });
};

export const getPanchangCalendarGrid = (
  month: number,
  year: number,
  latitude: number,
  longitude: number,
): Promise<CalendarDay[]> => {
  const apiUrl = GET_CALENDAR_GRID.replace('{month}', month.toString())
    .replace('{year}', year.toString())
    .replace('{latitude}', latitude.toString())
    .replace('{longitude}', longitude.toString());
  console.log('getPanchangCalendarGrid URL:', apiUrl);
  return new Promise((resolve, reject) => {
    apiDev
      .get(apiUrl)
      .then(response => {
        if (response.data && response.data.data) {
          resolve(response.data.data as CalendarDay[]);
        } else {
          resolve([]);
        }
      })
      .catch(error => {
        console.error(
          'Error fetching panchang calendar grid:',
          error?.response?.data || error,
        );
        reject(error);
      });
  });
};

export const getPanchangDayDetails = (
  date: string,
  latitude: number,
  longitude: number,
): Promise<CalendarDay> => {
  const apiUrl = GET_DAY_DETAILS.replace('{date}', date)
    .replace('{latitude}', latitude.toString())
    .replace('{longitude}', longitude.toString());
  console.log('getPanchangDayDetails URL:', apiUrl);
  return new Promise((resolve, reject) => {
    apiDev
      .get(apiUrl)
      .then(response => {
        if (response.data && response.data.data) {
          resolve(response.data.data as CalendarDay);
        } else {
          reject('No data found');
        }
      })
      .catch(error => {
        console.error(
          'Error fetching panchang day details:',
          error?.response?.data || error,
        );
        reject(error);
      });
  });
};

export const postSignUp = (data: SignupRequest): Promise<SignUpResponse> => {
  console.log('Sending signup request with FormData');
  let apiUrl = POST_SIGNUP;
  return new Promise((resolve, reject) => {
    apiDev
      .post(apiUrl, data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      .then(response => {
        resolve(response.data);
      })
      .catch(error => {
        console.error('Error fetching sign up data:', error);
        console.log('Signup error details:', {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status,
        });
        reject(error);
      });
  });
};

export const getCity = (id: string) => {
  const apiUrl = GET_CITY.replace('{id}', id);
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

export const getPujaList = () => {
  let apiUrl = GET_PUJALIST;
  return new Promise((resolve, reject) => {
    apiDev
      .get(apiUrl)
      .then(response => {
        resolve(response.data);
      })
      .catch(error => {
        console.error('Error fetching PujaList data:', error);
        reject(error);
      });
  });
};

export const getRecommendedPandit = (
  latitude: string,
  longitude: string,
): Promise<any> => {
  const apiUrl = `/app/recommended-panditji?latitude=${latitude}&longitude=${longitude}`;
  return new Promise((resolve, reject) => {
    apiDev
      .get(apiUrl)
      .then(response => {
        resolve(response.data);
      })
      .catch(error => {
        console.error(
          'Error fetching recommended pandit:',
          error.response.data,
        );
        reject(error);
      });
  });
};

export const getTirthPlace = () => {
  let apiUrl = GET_TIRTH_PLACE;
  return new Promise((resolve, reject) => {
    apiDev
      .get(apiUrl)
      .then(response => {
        resolve(response.data);
      })
      .catch(error => {
        console.error('Error fetching TirthPlace data:', error.response.data);
        reject(error);
      });
  });
};

export const getMuhrat = (
  date: string,
  latitude: string,
  longitude: string,
): Promise<any> => {
  const apiUrl = GET_MUHRAT.replace('{date}', date)
    .replace('{latitude}', latitude)
    .replace('{longitude}', longitude);
  return new Promise((resolve, reject) => {
    apiDev
      .get(apiUrl)
      .then(response => {
        resolve(response.data);
      })
      .catch(error => {
        console.error('Error fetching muhrat:', error);
        reject(error);
      });
  });
};

export const getAddress = () => {
  let apiUrl = GET_USER_ADDRESS;
  return new Promise((resolve, reject) => {
    apiDev
      .get(apiUrl)
      .then(response => {
        resolve(response.data);
      })
      .catch(error => {
        console.error('Error getAddress data:', error);
        reject(error);
      });
  });
};

export const deleteAddress = (data: deleteAddress) => {
  let apiUrl = GET_USER_ADDRESS;
  return new Promise((resolve, reject) => {
    apiDev
      .delete(apiUrl, { data })
      .then(response => {
        resolve(response);
      })
      .catch(error => {
        console.error('Error delete address', error);
        reject(error);
      });
  });
};

export const getAddressType = () => {
  let apiUrl = GET_ADDRESS_TYPE;
  return new Promise((resolve, reject) => {
    apiDev
      .get(apiUrl)
      .then(response => {
        resolve(response.data);
      })
      .catch(error => {
        console.error('Error getAddress Type:', error);
        reject(error);
      });
  });
};

export const getAddressTypeForBooking = () => {
  let apiUrl = GET_ADDRESS_TYPE_FOR_BOOKING;
  return new Promise((resolve, reject) => {
    apiDev
      .get(apiUrl)
      .then(response => {
        resolve(response.data);
      })
      .catch(error => {
        console.error('Error getAddress Type:', error);
        reject(error);
      });
  });
};

export const postAddAddress = (data: AddAddress) => {
  let apiUrl = POST_ADD_ADDRESS;
  console.log('postAddAddress data ::', data);
  return new Promise((resolve, reject) => {
    apiDev
      .post(apiUrl, data)
      .then(response => {
        resolve(response);
      })
      .catch(error => {
        console.error('Error add address', error);
        reject(error);
      });
  });
};

export const updateAddress = (data: EditAddress) => {
  let apiUrl = GET_USER_ADDRESS;
  return new Promise((resolve, reject) => {
    apiDev
      .put(apiUrl, data)
      .then(response => {
        resolve(response);
      })
      .catch(error => {
        console.error('Error update address', error);
        reject(error);
      });
  });
};

export const getPoojaDetails = (panditId: string, id: string): Promise<any> => {
  const apiUrl = GET_POOJA_DETAILS.replace('{panditId}', panditId).replace(
    '{id}',
    id,
  );
  return new Promise((resolve, reject) => {
    apiDev
      .get(apiUrl)
      .then(response => {
        resolve(response.data);
      })
      .catch(error => {
        console.error('Error fetching puja details:', error);
        reject(error);
      });
  });
};

export const getPoojaDetailsForPujaList = (id: string): Promise<any> => {
  const apiUrl = GET_POOJA_DETAIL_FOR_PUJA_LIST.replace('{id}', id);
  return new Promise((resolve, reject) => {
    apiDev
      .get(apiUrl)
      .then(response => {
        resolve(response.data);
      })
      .catch(error => {
        console.error('Error fetching puja details:', error);
        reject(error);
      });
  });
};

export const postBooking = (data: Booking) => {
  let apiUrl = POST_BOOKING;
  return new Promise((resolve, reject) => {
    apiDev
      .post(apiUrl, data)
      .then(response => {
        console.log('response for booking1', response);
        resolve(response);
        console.log('response for booking2', response);
      })
      .catch(error => {
        console.error('Error Booking', error.response.data);
        reject(error);
      });
  });
};

export const getPanditji = (
  puja_id: string,
  latitude: string,
  longitude: string,
  mode: 'auto' | 'manual',
  bookingDate: string,
  tirth: number,
): Promise<any> => {
  console.log('tirth :::: ', tirth);
  const apiUrl = GET_AUTO_MANUAL_PANDIT_SELECTION.replace('{puja_id}', puja_id)
    .replace('{latitude}', latitude)
    .replace('{longitude}', longitude)
    .replace('{mode}', mode)
    .replace('{booking_date}', bookingDate)
    .replace('{tirth_id}', String(tirth));
  return new Promise((resolve, reject) => {
    apiDev
      .get(apiUrl)
      .then(response => {
        resolve(response.data);
      })
      .catch(error => {
        console.error(
          'Error fetching panditji:',
          JSON.stringify(error.response.data),
        );
        reject(error);
      });
  });
};

export const getAllPanditji = (lat?: string, lon?: string) => {
  let apiUrl = GET_ALL_PANDIT_LIST.replace('{lat}', lat ?? '').replace(
    '{lon}',
    lon ?? '',
  );
  console.log('apiUrl :: ', apiUrl);
  return new Promise((resolve, reject) => {
    apiDev
      .get(apiUrl)
      .then(response => {
        resolve(response.data);
      })
      .catch(error => {
        console.error('Error getAllPanditji list :: ', error);
        reject(error);
      });
  });
};

export const getPanditDetails = (id: string): Promise<any> => {
  const apiUrl = GET_PANDIT_DETAILS.replace('{id}', id);
  return new Promise((resolve, reject) => {
    apiDev
      .get(apiUrl)
      .then(response => {
        resolve(response.data);
      })
      .catch(error => {
        console.error('Error fetching pandit details:', error);
        reject(error);
      });
  });
};

export const postCreateRazorpayOrder = (data: CreateRazorpayOrder) => {
  console.log('data', data);
  let apiUrl = POST_CREATE_RAZORPAY_ORDER;
  return new Promise((resolve, reject) => {
    apiDev
      .post(apiUrl, data)
      .then(response => {
        resolve(response);
      })
      .catch(error => {
        console.error('error ====>', JSON.stringify(error.message));
        // console.error('Error create razorpay order', error);
        reject(error);
      });
  });
};

export const postVerrifyPayment = (
  data: VerrifyPayment,
  latitude: string,
  longitude: string,
) => {
  let apiUrl = POST_VERIFY_PAYMENT.replace('{latitude}', latitude).replace(
    '{longitude}',
    longitude,
  );
  return new Promise((resolve, reject) => {
    apiDev
      .post(apiUrl, data)
      .then(response => {
        resolve(response);
      })
      .catch(error => {
        console.error('Error create razorpay order', error.response?.data);
        reject(error);
      });
  });
};

export const postRatePandit = (data: RatePandit) => {
  let apiUrl = POST_RATE_PANDIT;
  return new Promise((resolve, reject) => {
    apiDev
      .post(apiUrl, data)
      .then(response => {
        resolve(response);
      })
      .catch(error => {
        console.error('Error rate pandit', error.response.data);
        reject(error);
      });
  });
};

export const getUpcomingPujas = () => {
  let apiUrl = GET_UPCOMING_PUJA;
  return new Promise((resolve, reject) => {
    apiDev
      .get(apiUrl)
      .then(response => {
        resolve(response.data);
      })
      .catch(error => {
        console.error('Error getUpcoming puja list :: ', error);
        reject(error);
      });
  });
};

export const getUpcomingPujaDetails = (id: string): Promise<any> => {
  const apiUrl = GET_UPCOMING_PUJA_DETAILS.replace('{id}', id);
  return new Promise((resolve, reject) => {
    apiDev
      .get(apiUrl)
      .then(response => {
        resolve(response.data);
      })
      .catch(error => {
        console.error('Error fetching UpcomingPuja details:', error);
        reject(error);
      });
  });
};

export const getWallet = () => {
  let apiUrl = GET_WALLET;
  return new Promise((resolve, reject) => {
    apiDev
      .get(apiUrl)
      .then(response => {
        resolve(response.data);
      })
      .catch(error => {
        console.error('Error in wallet api :: ', error);
        reject(error);
      });
  });
};

export const getTransaction = () => {
  let apiUrl = GET_TRANSACTION;
  return new Promise((resolve, reject) => {
    apiDev
      .get(apiUrl)
      .then(response => {
        resolve(response.data);
      })
      .catch(error => {
        console.error('Error in Transaction api :: ', error);
        reject(error);
      });
  });
};
export const postCancelBooking = (
  id: string,
  data: bookingCancellation,
): Promise<any> => {
  const apiUrl = POST_CANCEL_BOOKING.replace('{id}', id);
  return new Promise((resolve, reject) => {
    apiDev
      .post(apiUrl, data)
      .then(response => {
        resolve(response);
      })
      .catch(error => {
        console.error('Error cancel booking:', error?.response?.data);
        reject(error);
      });
  });
};

export const getInProgress = () => {
  let apiUrl = GET_IN_PROGRESS;
  return new Promise((resolve, reject) => {
    apiDev
      .get(apiUrl)
      .then(response => {
        resolve(response.data);
      })
      .catch(error => {
        console.error('Error in In-progress api :: ', error.response.data);
        reject(error);
      });
  });
};

export const getEditProfile = () => {
  let apiUrl = GET_EDIT_PROFILE;
  return new Promise((resolve, reject) => {
    apiDev
      .get(apiUrl)
      .then(response => {
        resolve(response.data);
      })
      .catch(error => {
        console.error(
          'Error in get edit profile data api :: ',
          error.response.data,
        );
        reject(error);
      });
  });
};

export const putEditProfile = (params: any) => {
  let apiUrl = PUT_EDIT_PROFILE;
  return new Promise((resolve, reject) => {
    apiDev
      .put(apiUrl, params, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      .then(response => {
        resolve(response.data);
      })
      .catch(error => {
        console.error(
          'Error in put edit profile api :: ',
          error.response?.data || error,
        );
        reject(error);
      });
  });
};

export const postStartChat = (data: any): Promise<any> => {
  let apiUrl = POST_START_CHAT;
  return new Promise((resolve, reject) => {
    apiDev
      .post(apiUrl, data)
      .then(response => {
        resolve(response.data);
      })
      .catch(error => {
        console.error('Error starting chat:', error);
        reject(error);
      });
  });
};

export const getChatHistory = (id: string): Promise<any> => {
  const apiUrl = GET_CHAT_MESSAGES.replace('{id}', id);
  return new Promise((resolve, reject) => {
    apiDev
      .get(apiUrl)
      .then(response => {
        resolve(response.data);
      })
      .catch(error => {
        console.error('Error in getting chat history ::', error);
        reject(error);
      });
  });
};

export const getPastBookings = () => {
  let apiUrl = GET_PAST_BOOKINGS;
  return new Promise((resolve, reject) => {
    apiDev
      .get(apiUrl)
      .then(response => {
        resolve(response);
      })
      .catch(error => {
        console.error('Error in getting past bookings ::', error);
        reject(error);
      });
  });
};

export const postRegisterFCMToken = (
  device_token: string,
  app_type: string,
): Promise<any> => {
  let apiUrl = POST_REGISTER_FCM;
  return new Promise((resolve, reject) => {
    apiDev
      .post(apiUrl, { device_token, app_type })
      .then(response => {
        resolve(response.data);
      })
      .catch(error => {
        console.error(
          'Error in registering fcm token :: ',
          error?.response?.data,
        );
        reject(error);
      });
  });
};

export const getState = () => {
  let apiUrl = GET_STATE;
  return new Promise((resolve, reject) => {
    apiDev
      .get(apiUrl)
      .then(response => {
        resolve(response);
      })
      .catch(error => {
        console.error('Error in getting state ::', error);
        reject(error);
      });
  });
};

export const getOldCityApi = () => {
  let apiUrl = GET_OLD_CITY_API;
  return new Promise((resolve, reject) => {
    apiDev
      .get(apiUrl)
      .then(response => {
        resolve(response.data);
      })
      .catch(error => {
        console.error('Error fetching old city data:', error);
        reject(error);
      });
  });
};

export const postReviewImageUpload = (data: any, id: string): Promise<any> => {
  // data should be a FormData instance with one or more 'images' fields
  const apiUrl = POST_REVIEW_IMAGES.replace('{id}', id);
  return new Promise((resolve, reject) => {
    apiDev
      .post(apiUrl, data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        // If you need to send auth, add Authorization header here
      })
      .then(response => {
        console.log('response', response);
        resolve(response.data);
      })
      .catch(error => {
        console.error(
          'Error uploading review image:',
          error?.response?.data || error,
        );
        reject(error);
      });
  });
};

export const getPanditPujaList = (panditId: string): Promise<any> => {
  const apiUrl = GET_PANDIT_PUJA_LIST.replace('{panditId}', panditId);
  return new Promise((resolve, reject) => {
    apiDev
      .get(apiUrl)
      .then(response => {
        resolve(response.data);
      })
      .catch(error => {
        console.error('Error fetching pandit puja list:', error);
        reject(error);
      });
  });
};

export const getPanditAvailability = (panditId: any): Promise<any> => {
  const apiUrl = GET_PANDIT_AVAILABILITY.replace('{pandit_id}', panditId);
  return new Promise((resolve, reject) => {
    apiDev
      .get(apiUrl)
      .then(response => {
        resolve(response.data);
      })
      .catch(error => {
        console.error('Error fetching pandit available date:', error);
        reject(error);
      });
  });
};

export const postAutoBooking = (
  data: any,
  latitude: any,
  longitude: any,
): Promise<any> => {
  let apiUrl = POST_AUTO_BOOKING.replace('{latitude}', latitude).replace(
    '{longitude}',
    longitude,
  );
  return new Promise((resolve, reject) => {
    apiDev
      .post(apiUrl, data)
      .then(response => {
        resolve(response.data);
      })
      .catch(error => {
        console.error('Error in auto booking ::', error);
        reject(error);
      });
  });
};

export const getActivePuja = (): Promise<any> => {
  const apiUrl = GET_ACTIVE_PUJA;
  return new Promise((resolve, reject) => {
    apiDev
      .get(apiUrl)
      .then(response => {
        resolve(response.data);
      })
      .catch(error => {
        console.error('Error fetching active puja:', error);
        reject(error);
      });
  });
};

export const getNewPanditji = (
  bookingId: string,
  latitude: string,
  longitude: string,
): Promise<any> => {
  const apiUrl = GET_NEW_PANDITJI.replace('{latitude}', latitude)
    .replace('{longitude}', longitude)
    .replace('{booking_Id}', bookingId);
  return new Promise((resolve, reject) => {
    apiDev
      .get(apiUrl)
      .then(response => {
        resolve(response.data);
      })
      .catch(error => {
        console.error(
          'Error fetching new panditji list:',
          JSON.stringify(error.response.data),
        );
        reject(error);
      });
  });
};

export const postNewPanditOffer = (data: any): Promise<any> => {
  let apiUrl = POST_NEW_PANDITJI_OFFER;
  return new Promise((resolve, reject) => {
    apiDev
      .post(apiUrl, data)
      .then(response => {
        resolve(response.data);
      })
      .catch(error => {
        console.error('Error in new pandit offer :: ', error);
        reject(error);
      });
  });
};

export const getPlatformDetails = (): Promise<any> => {
  const apiUrl = GET_PLATFORM_DETAILS;
  return new Promise((resolve, reject) => {
    apiDev
      .get(apiUrl)
      .then(response => {
        resolve(response.data);
      })
      .catch(error => {
        console.error('Error fetching platform details:', error);
        reject(error);
      });
  });
};

export const deleteAccount = (data: DeleteAccountRequest) => {
  const apiUrl = POST_DELETE_ACCOUNT;
  return new Promise((resolve, reject) => {
    apiDev
      .post(apiUrl, { data })
      .then(response => {
        resolve(response);
      })
      .catch(error => {
        console.error('Error deleting account', error);
        reject(error);
      });
  });
};

export const getTermsAndConditions = (): Promise<any> => {
  const apiUrl = GET_TERMS_AND_CONDITIONS;
  return new Promise((resolve, reject) => {
    apiDev
      .get(apiUrl, {
        headers: {
          Accept: 'text/html',
        },
      })
      .then(response => {
        resolve(response.data);
      })
      .catch(error => {
        console.error('Error fetching terms and conditions', error);
        reject(error);
      });
  });
};

export const getUserAgreement = (): Promise<any> => {
  const apiUrl = GET_USER_AGREEMENT;
  return new Promise((resolve, reject) => {
    apiDev
      .get(apiUrl, {
        headers: {
          Accept: 'text/html',
        },
      })
      .then(response => {
        resolve(response.data);
      })
      .catch(error => {
        console.error('Error fetching user agreement', error);
        reject(error);
      });
  });
};

export const getRefundPolicy = (): Promise<any> => {
  const apiUrl = GET_REFUND_POLICY;
  return new Promise((resolve, reject) => {
    apiDev
      .get(apiUrl, {
        headers: {
          Accept: 'text/html',
        },
      })
      .then(response => {
        resolve(response.data);
      })
      .catch(error => {
        console.error('Error fetching refund policy', error);
        reject(error);
      });
  });
};

export const postCreateMeeting = (booking_id: any): Promise<any> => {
  let apiUrl = POST_CREATE_MEETING;
  return new Promise((resolve, reject) => {
    apiDev
      .post(apiUrl, { booking_id })
      .then(response => {
        resolve(response.data);
      })
      .catch(error => {
        console.error('Error in post create meeting api :: ', error);
        reject(error);
      });
  });
};

export const updateWaitingUser = (booking_id: any): Promise<any> => {
  let apiUrl = UPDATE_WAITING_USER;
  return new Promise((resolve, reject) => {
    apiDev
      .post(apiUrl, { booking_id })
      .then(response => {
        resolve(response.data);
      })
      .catch(error => {
        console.error('Error updating waiting user:', error);
        reject(error);
      });
  });
};

export const getDynamicHours = (booking_id: any): Promise<any> => {
  const apiUrl = GET_DYNAMIC_HOURS.replace('{booking_id}', booking_id);
  return new Promise((resolve, reject) => {
    apiDev
      .get(apiUrl)
      .then(response => {
        resolve(response.data);
      })
      .catch(error => {
        console.error('Error fetching dynamic hours date:', error);
        reject(error);
      });
  });
};
export const postCreateKundli = (data: any): Promise<any> => {
  console.log('Sending create kundli request');
  let apiUrl = CREATE_KUNDLI;
  return new Promise((resolve, reject) => {
    apiDev
      .post(apiUrl, data)
      .then(response => {
        resolve(response.data);
      })
      .catch(error => {
        console.error('Error creating kundli:', error);
        reject(error);
      });
  });
};

export const searchCity = async (query: string): Promise<any[]> => {
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
      query,
    )}&format=json&addressdetails=1&limit=5`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'PujaGuruApp/1.0',
      },
    });
    if (!response.ok) {
      return [];
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error searching city:', error);
    return [];
  }
};

export const getKundliList = async (): Promise<any[]> => {
  let apiUrl = GET_KUNDLI_LIST;
  return new Promise((resolve, reject) => {
    apiDev
      .get(apiUrl)
      .then(response => {
        resolve(response.data);
      })
      .catch(error => {
        console.error('Error fetching kundli list:', error);
        reject(error);
      });
  });
};

export const getKundliDetails = async (id: number): Promise<any> => {
  let apiUrl = GET_KUNDLI_DETAILS.replace('{id}', id.toString());
  return new Promise((resolve, reject) => {
    apiDev
      .get(apiUrl)
      .then(response => {
        resolve(response.data);
      })
      .catch(error => {
        console.error('Error fetching kundli details:', error);
        reject(error);
      });
  });
};

export const getDailyHoroscope = async (
  rashi: string,
): Promise<HoroscopeResponse | null> => {
  try {
    const url = GET_DAILY_HOROSCOPE.replace('{rashi}', rashi);
    const response = await apiDev.get(url);
    return response.data;
  } catch (error) {
    console.error('Error fetching daily horoscope:', error);
    return null;
  }
};

export const getAiHealth = async (): Promise<any> => {
  try {
    const response = await apiDev.get(GET_AI_HEALTH);
    return response.data;
  } catch (error: any) {
    console.error('Error in AI health check:', error);
    return null;
  }
};

export const getAiHistory = async (page: number = 1) => {
  try {
    const response = await apiDev.get(`${GET_AI_HISTORY}?page=${page}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching chat history:', error);
    throw error;
  }
};

// Text Chat: Standard SSE streaming
export const getAiTextStream = async (
  text: string,
): Promise<EventSource | null> => {
  try {
    const token = await AsyncStorage.getItem(AppConstant.ACCESS_TOKEN);
    if (!token) {
      console.error('Authentication token not found for stream.');
      return null;
    }

    const fullUrl = `${APP_URL}${POST_AI_STREAM}`;

    const headers: any = {
      Authorization: `Bearer ${token}`,
      Accept: 'text/event-stream',
      'Content-Type': 'application/json',
    };

    const body = JSON.stringify({ text });

    console.log('------------------------------------------------');
    console.log('------------getAiTextStream-config-------------');
    console.log('------------------------------------------------');
    console.log('FullUrl : ', fullUrl);
    console.log('Headers : ', headers);
    console.log('Body : ', body);
    console.log('------------------------------------------------');

    const eventSource = new EventSource(fullUrl, {
      method: 'POST',
      headers: headers,
      body: body,
    });

    return eventSource;
  } catch (error) {
    console.error('Error creating text stream:', error);
    return null;
  }
};

export const getAiVoiceStream = async (
  audioPath: string,
): Promise<EventSource | null> => {
  try {
    const token = await AsyncStorage.getItem(AppConstant.ACCESS_TOKEN);
    if (!token) {
      console.error('Authentication token not found for stream.');
      return null;
    }

    const fullUrl = `${APP_URL}${POST_AI_STREAM}`;
    console.log('Voice Payload (Upload → Replay SSE):', audioPath);

    // --------------------------------------------------
    // Proxy EventSource (to replay backend SSE)
    // --------------------------------------------------
    const proxyEventSource: any = {
      _listeners: {} as Record<string, Function[]>,
      _realEventSource: null as EventSource | null,
      readyState: 0,
      url: fullUrl,
      CONNECTING: 0,
      OPEN: 1,
      CLOSED: 2,

      addEventListener(event: string, callback: Function) {
        if (!this._listeners[event]) {
          this._listeners[event] = [];
        }
        this._listeners[event].push(callback);
      },

      removeAllListeners() {
        this._listeners = {};
      },

      close() {
        console.log('Proxy EventSource closed');
        this.readyState = this.CLOSED;
        if (this._realEventSource) {
          this._realEventSource.close();
        }
      },

      emit(event: string, data: any) {
        if (event === 'open') this.readyState = this.OPEN;
        const listeners = this._listeners[event] || [];
        listeners.forEach((cb: any) =>
          cb({
            type: event,
            data: data ? JSON.stringify(data) : undefined,
          }),
        );
      },
    };

    // --------------------------------------------------
    // Async upload + SSE replay
    // --------------------------------------------------
    (async () => {
      try {
        // Emit open immediately (UI responsiveness)
        await new Promise((r: any) => setTimeout(r, 50));
        proxyEventSource.emit('open', {});

        // Build FormData
        const formData = new FormData();
        const uri = audioPath.startsWith('file://')
          ? audioPath
          : `file://${audioPath}`;

        formData.append('audio', {
          uri,
          type: 'audio/wav',
          name: 'voice.wav',
        } as any);

        console.log('Uploading voice file...');

        // ⚠️ FETCH (DO NOT SET Content-Type)
        const response = await fetch(fullUrl, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'text/event-stream',
          },
          body: formData,
        });

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(errText);
        }

        const responseText = await response.text();

        // --------------------------------------------------
        // Parse SSE-style response
        // --------------------------------------------------
        const events = responseText.split('\n\n');

        for (const eventBlock of events) {
          if (!eventBlock.trim()) continue;

          // Artificial delay for typewriter effect (Simulated Streaming)
          await new Promise(r => setTimeout(() => r(true), 30));

          const lines = eventBlock.split('\n');
          let eventName = '';
          let dataStr = '';

          for (const line of lines) {
            if (line.startsWith('event:')) {
              eventName = line.replace('event:', '').trim();
            } else if (line.startsWith('data:')) {
              dataStr += line.replace('data:', '').trim();
            }
          }

          if (!eventName || !dataStr) continue;

          try {
            const parsed = JSON.parse(dataStr);

            if (eventName === 'transcription') {
              proxyEventSource.emit('transcription', {
                text: parsed.content || parsed.text,
              });
            } else if (eventName === 'text') {
              proxyEventSource.emit('text', parsed);
            } else {
              proxyEventSource.emit(eventName, parsed);
            }
          } catch (e) {
            console.error('Failed to parse SSE chunk:', e);
          }
        }

        proxyEventSource.emit('done', {});
      } catch (err: any) {
        console.error('Upload-Replay chain failed:', err?.message || err);
        proxyEventSource.emit('error', err);
      }
    })();

    return proxyEventSource as EventSource;
  } catch (error) {
    console.error('Error creating voice stream:', error);
    return null;
  }
};
