/**
 * API Service - Handle all backend API communications
 */
import axios from 'axios';

// Use environment variable for API URL in production, fallback to relative path for development
const apiBaseURL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : '/api';

const apiClient = axios.create({
  baseURL: apiBaseURL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Add response interceptor for error handling
apiClient.interceptors.response.use(
  response => response,
  error => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

/**
 * Land Data APIs
 */
export const landAPI = {
  // Get lands within bounding box (for map)
  getByBbox: async (minLng, minLat, maxLng, maxLat, limit = 500) => {
    const response = await apiClient.get('/lands/bbox', {
      params: { min_lng: minLng, min_lat: minLat, max_lng: maxLng, max_lat: maxLat, limit }
    });
    return response.data;
  },

  // Get single land detail
  getById: async (id) => {
    const response = await apiClient.get(`/lands/${id}`);
    return response.data;
  },

  // List lands with pagination
  list: async (limit = 20, offset = 0) => {
    const response = await apiClient.get('/lands/', {
      params: { limit, offset }
    });
    return response.data;
  }
};

/**
 * Search APIs
 */
export const searchAPI = {
  // Search lands by criteria
  search: async (params) => {
    const response = await apiClient.get('/search/', { params });
    return response.data;
  },

  // Get all cities
  getCities: async () => {
    const response = await apiClient.get('/search/cities');
    return response.data;
  },

  // Get districts by city
  getDistricts: async (city = null) => {
    const response = await apiClient.get('/search/districts', {
      params: city ? { city } : {}
    });
    return response.data;
  },

  // Get sections
  getSections: async (city = null, district = null) => {
    const params = {};
    if (city) params.city = city;
    if (district) params.district = district;

    const response = await apiClient.get('/search/sections', { params });
    return response.data;
  }
};

/**
 * Statistics APIs
 */
export const statsAPI = {
  // Get summary statistics
  getSummary: async () => {
    const response = await apiClient.get('/stats/summary');
    return response.data;
  },

  // Get statistics by city
  getByCity: async () => {
    const response = await apiClient.get('/stats/by-city');
    return response.data;
  },

  // Get statistics by district
  getByDistrict: async (city = null) => {
    const params = city ? { city } : {};
    const response = await apiClient.get('/stats/by-district', { params });
    return response.data;
  }
};

export default {
  land: landAPI,
  search: searchAPI,
  stats: statsAPI
};
