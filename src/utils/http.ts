import axios from "axios";
import { Platform } from "react-native";

// Enum for HTTP Status Codes
export enum HttpStatusCode {
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  UNSUPPORTED_MEDIA_TYPE = 415,
  UNACCEPTABLE = 406,
  METHOD_NOT_ALLOWED = 405,
  ALREADY_EXISTS = 409,
  CONFLICT = 408,
  VERSION_OUT_OF_DATE = 418,
  SERVER_ERROR = 500,
  SERVICE_UNAVAILABLE = 503,
  NETWORK_CONNECT_TIMEOUT = 599,
}

export const baseURL = __DEV__
  ? Platform.select({
      android: 'https://astrodha.ai/api',
      ios: 'https://astrodha.ai/api',
      default: 'https://astrodha.ai/api',
    })
  : Platform.select({
      android: 'https://astrodha.ai/api',
      ios: 'https://astrodha.ai/api',
      default: 'https://astrodha.ai/api',
    }); // Production URL

// Create Axios instance with default headers
const http = axios.create({
  baseURL,
  // timeout: 60000, // Increased timeout to 30 seconds
  headers: {
    "Content-Type": "application/json",
    "Accept": "application/json",
  },
});

let onNetworkError: ((error: unknown) => void) | null = null;

export function setHttpNetworkErrorHandler(
  handler: ((error: unknown) => void) | null,
) {
  onNetworkError = handler;
}

// Request interceptor for adding auth token
// http.interceptors.request.use(
//   async (config) => {
//     try {
//       const jsonValue = await AsyncStorage.getItem('USER_DATA');
//       const data = jsonValue != null ? JSON.parse(jsonValue) : null;
//       const token = data?.token;

//       if (token) {
//         config.headers.token = token;
//       }
//     } catch (error) {
//       console.error('Error setting auth token:', error);
//     }
//     return config;
//   },
//   (error) => {
//     return Promise.reject(error);
//   }
// );

// // Response interceptor for handling errors
// http.interceptors.response.use(
//   (response) => response,
//   async (error) => {
//     if (error.response?.status === HttpStatusCode.UNAUTHORIZED) {
//       // Handle unauthorized error (e.g., clear storage and redirect to login)
//       await AsyncStorage.clear();
//       // You might want to add navigation logic here
//     }
//     return Promise.reject(error);
//   }
// );

http.interceptors.response.use(
  response => response,
  error => {
    const isLikelyNetworkError =
      !error?.response &&
      (error?.code === 'ERR_NETWORK' ||
        error?.message === 'Network Error' ||
        error?.code === 'ECONNABORTED');

    if (isLikelyNetworkError) {
      onNetworkError?.(error);
    }

    return Promise.reject(error);
  },
);

export default http;
