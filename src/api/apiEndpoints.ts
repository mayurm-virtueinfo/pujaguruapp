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

export const POST_SIGNIN = '/auth/signin/';
export const POST_SIGNUP = '/auth/register/';
export const GET_CITY = '/auth/areas/';
export const POST_LOGOUT = '/auth/logout/';
export const POST_REFRESH_TOKEN = '/auth/refresh-token/';
