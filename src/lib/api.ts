import axios from 'axios';

const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

const CSRF_COOKIE_NAME = 'csrftoken';
const CSRF_HEADER_NAME = 'X-CSRFToken';
const UNSAFE_METHODS = new Set(['post', 'put', 'patch', 'delete']);

function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

// Django requires a primed `csrftoken` cookie (fetched via GET /auth/csrf/)
// before it will accept the X-CSRFToken header on any unsafe request made
// with the auth cookie present. Without this, login stays fine but logout,
// refresh, and every authenticated POST/PUT/PATCH/DELETE get rejected 403.
let csrfRequest: Promise<unknown> | null = null;

function ensureCsrfCookie() {
  if (getCookie(CSRF_COOKIE_NAME)) return Promise.resolve();
  if (!csrfRequest) {
    csrfRequest = api.get('/auth/csrf/').finally(() => {
      csrfRequest = null;
    });
  }
  return csrfRequest;
}

api.interceptors.request.use(async (config) => {
  if (config.method && UNSAFE_METHODS.has(config.method.toLowerCase())) {
    await ensureCsrfCookie();
    const token = getCookie(CSRF_COOKIE_NAME);
    if (token) {
      config.headers.set(CSRF_HEADER_NAME, token);
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Check if the error is 401 Unauthorized and we haven't already retried
    if (error.response?.status === 401 && !originalRequest._retry && originalRequest.url !== '/auth/refresh/') {
      originalRequest._retry = true;
      try {
        await api.post('/auth/refresh/');
        // Retry the original request
        return api(originalRequest);
      } catch (refreshError) {
        // If refresh fails, it means the user's session is completely expired.
        // Let the application handle the redirect to login if necessary.
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
