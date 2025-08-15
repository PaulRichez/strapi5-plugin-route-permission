import { unstable_useDocument } from '@strapi/strapi/admin';

interface QueryParams {
  sort?: string;
  pageSize?: number;
  page?: number;
}

interface RoutePermission {
  permission: string;
  role: string;
  status: 'active' | 'inactive';
}

interface ApiResponse {
  data: {
    result: RoutePermission[];
    pagination: {
      total: number;
      pageCount: number;
    };
  };
}

// Simple fetch wrapper for API calls
const fetchAPI = async (url: string, options: RequestInit = {}) => {
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
};

export const apiRoutesPermission = {
  getConfiguredRoutes: async (params: QueryParams): Promise<ApiResponse> => {
    try {
      const queryString = new URLSearchParams(params as any).toString();
      const data = await fetchAPI(`/api/strapi5-plugin-route-permission/configured-routes?${queryString}`);
      
      return data;
    } catch (error) {
      console.error('Error fetching configured routes:', error);
      // Return mock data for now
      return {
        data: {
          result: [
            { permission: 'api::application.application.find', role: 'authenticated', status: 'active' },
            { permission: 'api::subscriber.subscriber.find', role: 'public', status: 'active' },
          ],
          pagination: {
            total: 2,
            pageCount: 1,
          },
        },
      };
    }
  },
};
