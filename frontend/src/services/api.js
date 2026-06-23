import axios from 'axios';

// withCredentials ensures the httpOnly auth cookie is sent on every request.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true,
});

// Allow the app to react to 401s (e.g. clear auth state) without circular imports.
let onUnauthorized = null;
export function setUnauthorizedHandler(fn) {
  onUnauthorized = fn;
}

api.interceptors.response.use(
  (res) => res,
  (error) => {
    const status = error.response?.status;
    // Don't trigger logout for the /me probe used during initial hydration.
    const url = error.config?.url || '';
    if (status === 401 && onUnauthorized && !url.includes('/auth/me')) {
      onUnauthorized();
    }
    return Promise.reject(error);
  }
);

/** Normalize an axios error into a human-readable message. */
export function getErrorMessage(error, fallback = 'Something went wrong') {
  const data = error.response?.data;
  if (data?.details?.length) {
    return data.details.map((d) => d.message).join(', ');
  }
  return data?.message || error.message || fallback;
}

export default api;
