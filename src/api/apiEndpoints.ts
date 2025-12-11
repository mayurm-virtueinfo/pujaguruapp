import Config from 'react-native-config';

class ApiEndpoints {
  static readonly XMasterKey =
    '$2a$10$XR82L3T4Q4gtDUAvZKwioOsmNaU2X7QVpkZbtKJ90jdcoVal/Pd4a';

  static readonly CITY_API = 'https://api.postalpincode.in/pincode';
  static readonly BASE_URL = 'https://api.jsonbin.io';
  static readonly API_VERSION = 'v3/b';

  // Mock API endpoints for demonstration
  static readonly CASTE_API = `${ApiEndpoints.API_VERSION}/684010988a456b7966a95413`;
  static readonly SUB_CASTE_API = `${ApiEndpoints.API_VERSION}/6840110f8960c979a5a51370`;
  static readonly GOTRA_API = `${ApiEndpoints.API_VERSION}/684010bd8960c979a5a51350`;
  static readonly AREA_API = `${ApiEndpoints.API_VERSION}/68401ec68960c979a5a51838`;
  static readonly POOJA_PERFORMED_API = `${ApiEndpoints.API_VERSION}/684033358561e97a501f8459`;
  static readonly ASTROLOGY_CONSLATION_PERFORMED_API = `${ApiEndpoints.API_VERSION}/6840339b8a456b7966a9601b`;
  static readonly LANGUAGES_API = `${ApiEndpoints.API_VERSION}/68403db38a456b7966a963f6`;
  static readonly POOJA_REQUESTS_API = `${ApiEndpoints.API_VERSION}/68428e788561e97a50203819`;
  static readonly ASTRO_SERVICES_API = `${ApiEndpoints.API_VERSION}/6842ff2a8960c979a5a5f4f5`;
  static readonly MESSAGES_API = `${ApiEndpoints.API_VERSION}/68466cab8960c979a5a6dc41`;
  static readonly POOJA_ITEMS_API = `${ApiEndpoints.API_VERSION}/684675428960c979a5a6de75`;
  static readonly CANCELLATION_REASON_API = `${ApiEndpoints.API_VERSION}/684691198960c979a5a6e6f5`;
  static readonly CANCELLATION_POLICY_API = `${ApiEndpoints.API_VERSION}/684695808a456b7966ab29c0`;
  static readonly PAST_BOOKINGS_API = `${ApiEndpoints.API_VERSION}/6846d3ec8561e97a502165ce`;
  static readonly POOJA_BOOKING_PLACE_API = `${ApiEndpoints.API_VERSION}/685e997b8561e97a502cc47d`;
  static readonly POOJA_ADDRESS_PLACE_API = `${ApiEndpoints.API_VERSION}/685ea65c8960c979a5b26706`;
  static readonly POOJA_TIRTH_PLACE_API = `${ApiEndpoints.API_VERSION}/685eaa898561e97a502cce3a`;
  static readonly HOME_DATA_API = `${ApiEndpoints.API_VERSION}/685e6f298960c979a5b24e1c`;
  static readonly PUJA_LIST_API = `${ApiEndpoints.API_VERSION}/685e858d8561e97a502cbc73`;
  static readonly PANDIT_LIST_API = `${ApiEndpoints.API_VERSION}/686259e18960c979a5b45e33`;
  static readonly PUJA_ITEMS_API = `${ApiEndpoints.API_VERSION}/6862805f8561e97a502edd41`;
  static readonly COMMENT_DATA_API = `${ApiEndpoints.API_VERSION}/6863ca368960c979a5b53077`;
  static readonly NOTIFICATION_DATA_API = `${ApiEndpoints.API_VERSION}/6867ade78561e97a50315d3b`;
  static readonly TRANSACTION_DATA_API = `${ApiEndpoints.API_VERSION}/6867afe08a456b7966bb3290`;
  static readonly ADDRESS_DATA_API = `${ApiEndpoints.API_VERSION}/6867a99d8960c979a5b6f38f`;
  static readonly REFRESH_TOKEN_API = `${ApiEndpoints.API_VERSION}/6867a99d8960c979a5b6f38f`;
}

export default ApiEndpoints;

export const APP_URL = Config.BASE_URL;
export const GET_PUJALIST = '/app/pujalist/';
export const POST_SIGNIN = '/app/auth/signin/';
export const POST_SIGNUP = '/app/auth/register/';
export const GET_CITY = '/app/state/{id}/cities/';
export const POST_LOGOUT = '/app/auth/logout/';
export const POST_REFRESH_TOKEN = '/app/auth/refresh-token/';
export const GET_RECOMMENDED_PANDIT =
  '/app/recommended-panditji?latitude={latitude}&longitude={longitude}';
export const GET_ADDRESS = '/app/address/{id}';
export const POST_ADD_ADDRESS = '/app/add-address/';
export const GET_USER_ADDRESS = '/app/addresses/';
export const GET_ADDRESS_TYPE_FOR_BOOKING = '/app/address-types-for-booking/';
export const GET_ADDRESS_TYPE = '/app/address-types/';
export const GET_TIRTH_PLACE = '/app/tirth-places/';
export const GET_MUHRAT =
  '/app/choghadiya?date={date}&latitude={latitude}&longitude={longitude}';
export const GET_PANCHANG =
  '/app/panchang/?date={date}&latitude={latitude}&longitude={longitude}';
export const GET_POOJA_DETAILS = '/app/puja-detail/{panditId}/{id}/';
export const GET_POOJA_DETAIL_FOR_PUJA_LIST = '/app/puja-detail/{id}/';
export const POST_BOOKING = '/app/booking/';
export const GET_AUTO_MANUAL_PANDIT_SELECTION =
  '/app/auto-assign-panditji?puja_id={puja_id}&latitude={latitude}&longitude={longitude}&mode={mode}&booking_date={booking_date}&tirth_id={tirth_id}';
export const GET_ALL_PANDIT_LIST = '/app/panditji-list/';
export const GET_PANDIT_DETAILS = '/panditji/my-details/{id}/';
export const POST_CREATE_RAZORPAY_ORDER = '/app/booking/create-razorpay-order/';
export const POST_VERIFY_PAYMENT =
  '/app/booking/verify-payment/?latitude={latitude}&longitude={longitude}';
export const POST_RATE_PANDIT = '/app/rate-pandit/';
export const GET_UPCOMING_PUJA = '/app/upcoming-pujas/';
export const GET_UPCOMING_PUJA_DETAILS = '/app/bookings/{id}/';
export const GET_WALLET = '/app/wallet/';
export const GET_TRANSACTION = '/app/wallet/transactions/';
export const POST_CANCEL_BOOKING = '/app/bookings/{id}/cancel/';
export const GET_IN_PROGRESS = '/app/bookings/in_progress/';
export const GET_EDIT_PROFILE = '/app/profile/me/';
export const PUT_EDIT_PROFILE = '/app/profile/me/';
export const POST_START_CHAT = '/api/chat/conversations/start-by-booking/';
export const GET_CHAT_MESSAGES = '/api/chat/conversations/{id}/messages/';
export const GET_PAST_BOOKINGS = '/app/bookings/past/';
export const POST_REGISTER_FCM = '/app/register-device-token/';
export const GET_STATE = '/app/states/';
export const GET_OLD_CITY_API = '/app/areas/';
export const POST_REVIEW_IMAGES =
  '/panditji/reviews/pandit-rating/{id}/upload-image/';
export const GET_PANDIT_PUJA_LIST = '/app/pandits/{panditId}/poojas/';
export const GET_PANDIT_AVAILABILITY =
  '/panditji/availability/?pandit_id={pandit_id}';
export const POST_AUTO_BOOKING =
  '/app/booking-auto/create/?latitude={latitude}&longitude={longitude}';
export const GET_ACTIVE_PUJA = '/app/booking-active/';
export const GET_NEW_PANDITJI =
  '/app/new-panditji-list/?latitude={latitude}&longitude={longitude}&booking_id={booking_Id}';
export const POST_NEW_PANDITJI_OFFER = '/app/new-pandit-offer/';
export const GET_PLATFORM_DETAILS = '/app/platform-settings/';
export const POST_DELETE_ACCOUNT = '/app/delete-user/';
export const GET_TERMS_AND_CONDITIONS = '/policies/page/terms/';
export const GET_USER_AGREEMENT = '/policies/page/user-agreement/';
export const GET_REFUND_POLICY = '/policies/page/refund-policy/';
export const POST_CREATE_MEETING = '/api/chat/create_meeting/';
export const UPDATE_WAITING_USER = '/app/user-is-waiting/';
export const GET_DYNAMIC_HOURS = '/app/dynamic-hours/?booking_id={booking_id}';
export const CREATE_KUNDLI = '/api/astro/kundali/create/';
export const GET_KUNDLI_LIST = '/api/astro/kundali/list/';
export const GET_KUNDLI_DETAILS = '/api/astro/kundali/{id}/';
