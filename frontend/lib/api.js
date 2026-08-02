const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export const getToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token');
  }
  return null;
};

export const setToken = (token) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('token', token);
  }
};

export const removeToken = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('token');
  }
};

export async function apiFetch(endpoint, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers,
  };

  try {
    const res = await fetch(`${API_URL}${endpoint}`, config);
    const data = await res.json();

    if (res.status === 401) {
      removeToken();
      if (typeof window !== 'undefined' && window.location.pathname !== '/login' && window.location.pathname !== '/register') {
        window.location.href = '/login';
      }
    }

    if (!res.ok) {
      return {
        success: false,
        error: {
          message: data?.error?.message || 'An error occurred processing your request.',
        },
      };
    }

    return data;
  } catch (err) {
    return {
      success: false,
      error: {
        message: err.message || 'Network error. Please check backend connection.',
      },
    };
  }
}
