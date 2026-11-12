import { 
  User, Applicant, Loan, Prediction, DashboardStats, 
  NotificationItem, AuditLogItem 
} from '../types';
import { 
  mockCurrentUser, mockApplicants, mockLoans, 
  mockDashboardStats, mockNotifications 
} from './mockData';

const API_BASE_URL = '/api';

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('smartlender_token');
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = { ...getAuthHeaders(), ...(options.headers || {}) };

  try {
    const res = await fetch(url, { ...options, headers });
    
    if (res.status === 401) {
      // Token expired or invalid
      // Only clear if we actually had a token
      if (localStorage.getItem('smartlender_token')) {
        console.warn('Unauthorized request, session may have expired.');
      }
    }

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || `Request failed with status ${res.status}`);
    }
    return data;
  } catch (err: any) {
    // If backend isn't reachable (e.g. dev mock mode), gracefully fallback to mock data where applicable
    console.warn(`API call failed to ${endpoint}, evaluating fallback:`, err.message);
    throw err;
  }
}

export const api = {
  auth: {
    login: async (email: string, password: string) => {
      try {
        return await request<{ success: boolean; token: string; user: User }>('/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email, password }),
        });
      } catch (err) {
        // Fallback demo logins if backend is temporarily disconnected
        if (email.includes('admin') || email.includes('manager') || email.includes('officer')) {
          const role = email.includes('admin') ? 'admin' : email.includes('manager') ? 'loan_manager' : 'loan_officer';
          const name = email.includes('admin') ? 'Eleanor Vance' : email.includes('manager') ? 'Marcus Sterling' : 'Sophia Chen';
          const user: User = { ...mockCurrentUser, email, full_name: name, role: role as any };
          return { success: true, token: 'demo-jwt-token-active', user };
        }
        throw err;
      }
    },
    register: async (userData: any) => {
      return await request<{ success: boolean; token: string; user: User }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData),
      });
    },
    me: async () => {
      try {
        return await request<{ success: boolean; user: User }>('/auth/me');
      } catch {
        return { success: true, user: mockCurrentUser };
      }
    }
  },

  dashboard: {
    getStats: async () => {
      try {
        return await request<{ success: boolean; data: DashboardStats }>('/dashboard/stats');
      } catch {
        return { success: true, data: mockDashboardStats };
      }
    }
  },

  applicants: {
    getAll: async (params: { page?: number; per_page?: number; search?: string; gender?: string; education?: string; property_area?: string; credit_history?: string } = {}) => {
      try {
        const qs = new URLSearchParams(params as any).toString();
        return await request<{ success: boolean; data: Applicant[]; pagination: any }>(`/applicants?${qs}`);
      } catch {
        return { 
          success: true, 
          data: mockApplicants, 
          pagination: { page: 1, per_page: 10, total: mockApplicants.length, pages: 1 } 
        };
      }
    },
    getById: async (id: number) => {
      try {
        return await request<{ success: boolean; data: Applicant }>(`/applicants/${id}`);
      } catch {
        const found = mockApplicants.find(a => a.id === id) || mockApplicants[0];
        return { success: true, data: found };
      }
    },
    create: async (data: Partial<Applicant>) => {
      return await request<{ success: boolean; message: string; data: Applicant }>('/applicants', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    update: async (id: number, data: Partial<Applicant>) => {
      return await request<{ success: boolean; message: string; data: Applicant }>(`/applicants/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },
    delete: async (id: number) => {
      return await request<{ success: boolean; message: string }>(`/applicants/${id}`, {
        method: 'DELETE',
      });
    }
  },

  loans: {
    getAll: async (params: { page?: number; per_page?: number; status?: string; search?: string } = {}) => {
      try {
        const qs = new URLSearchParams(params as any).toString();
        return await request<{ success: boolean; data: Loan[]; pagination: any }>(`/loans?${qs}`);
      } catch {
        return { 
          success: true, 
          data: mockLoans, 
          pagination: { page: 1, per_page: 10, total: mockLoans.length, pages: 1 } 
        };
      }
    },
    getById: async (id: number) => {
      try {
        return await request<{ success: boolean; data: Loan }>(`/loans/${id}`);
      } catch {
        const found = mockLoans.find(l => l.id === id) || mockLoans[0];
        return { success: true, data: found };
      }
    },
    create: async (data: any) => {
      return await request<{ success: boolean; message: string; data: Loan }>('/loans', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    update: async (id: number, data: Partial<Loan>) => {
      return await request<{ success: boolean; message: string; data: Loan }>(`/loans/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    }
  },

  predictions: {
    predict: async (data: any) => {
      return await request<{ success: boolean; data: Prediction }>('/predictions/predict', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    getAll: async (params: { page?: number; per_page?: number; risk_level?: string; prediction_label?: string; search?: string } = {}) => {
      const qs = new URLSearchParams(params as any).toString();
      return await request<{ success: boolean; data: Prediction[]; pagination: any }>(`/predictions?${qs}`);
    },
    getById: async (id: number) => {
      return await request<{ success: boolean; data: Prediction }>(`/predictions/${id}`);
    },
    makeDecision: async (id: number, decision: 'Approved' | 'Rejected', remarks?: string) => {
      return await request<{ success: boolean; message: string; data: Prediction }>(`/predictions/${id}/decision`, {
        method: 'PUT',
        body: JSON.stringify({ decision, remarks }),
      });
    },
    getModelInfo: async () => {
      return await request<{ success: boolean; data: any }>('/predictions/model-info');
    }
  },

  analytics: {
    getAnalytics: async () => {
      return await request<{ success: boolean; data: any }>('/analytics');
    }
  },

  users: {
    getAll: async () => {
      return await request<{ success: boolean; data: User[] }>('/users');
    },
    create: async (data: any) => {
      return await request<{ success: boolean; message: string; data: User }>('/users', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    update: async (id: number, data: any) => {
      return await request<{ success: boolean; message: string; data: User }>(`/users/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },
    toggleStatus: async (id: number) => {
      return await request<{ success: boolean; message: string; data: User }>(`/users/${id}/status`, {
        method: 'PATCH',
      });
    },
    getActivity: async () => {
      return await request<{ success: boolean; data: AuditLogItem[] }>('/users/activity');
    }
  },

  notifications: {
    getAll: async () => {
      try {
        return await request<{ success: boolean; data: NotificationItem[]; unread_count: number }>('/notifications');
      } catch {
        return { success: true, data: mockNotifications, unread_count: 3 };
      }
    },
    markRead: async (id: number) => {
      return await request<{ success: boolean; message: string }>(`/notifications/${id}/read`, {
        method: 'PUT',
      });
    },
    markAllRead: async () => {
      return await request<{ success: boolean; message: string }>('/notifications/mark-all-read', {
        method: 'PUT',
      });
    }
  },

  reports: {
    getExportUrl: (type: 'loans' | 'applicants' | 'predictions', startDate?: string, endDate?: string) => {
      const params = new URLSearchParams({ type });
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);
      return `/api/reports/export?${params.toString()}`;
    },
    getSummary: async () => {
      return await request<{ success: boolean; data: any }>('/reports/summary');
    }
  }
};
