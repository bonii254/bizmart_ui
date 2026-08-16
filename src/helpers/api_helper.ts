import axios, { AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from "axios";
import config from "../config";

const { api } = config;

axios.defaults.baseURL = api.API_URL;
axios.defaults.headers.post["Content-Type"] = "application/json";
axios.defaults.withCredentials = false;

// -------------------------------------------------------------
// 1. REQUEST INTERCEPTOR: Attach Session Headers
// -------------------------------------------------------------
axios.interceptors.request.use(
  (reqConfig: InternalAxiosRequestConfig) => {
    const authUser = sessionStorage.getItem("authUser");
    if (authUser) {
      try {
        const parsed = JSON.parse(authUser);
        const session = parsed?.data || parsed;

        if (session?.sessionId) {
          reqConfig.headers["X-Session-ID"] = session.sessionId;
        }
        if (session?.operatorId) {
          reqConfig.headers["X-Operator-ID"] = session.operatorId;
        }
      } catch (error) {
        console.error("Failed to parse authUser session from sessionStorage", error);
      }
    }
    return reqConfig;
  },
  (error) => Promise.reject(error)
);

// -------------------------------------------------------------
// 2. RESPONSE INTERCEPTOR: Direct 401 Session Handling
// -------------------------------------------------------------
axios.interceptors.response.use(
  (response: AxiosResponse) => (response.data ? response.data : response),
  async (error: any) => {
    if (error.response?.status === 401) {
      if (error.config?.url?.includes("/login")) {
        return Promise.reject(error);
      }

      sessionStorage.removeItem("authUser");
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
      return Promise.reject(error);
    }

    if (error.response) {
      return Promise.reject(error);
    } else if (error.request) {
      return Promise.reject("Network Error: Could not reach the server. Please check your connection.");
    } else {
      return Promise.reject(error.message || "An unexpected error occurred.");
    }
  }
);

class APIClient {
  get = (url: string, params?: any): Promise<any> => {
    return axios.get(url, { params });
  };

  create = (url: string, data: any, config?: AxiosRequestConfig): Promise<any> => {
    return axios.post(url, data, config);
  };

  createWithFile = (url: string, data: FormData, config?: AxiosRequestConfig): Promise<any> => {
    return axios.post(url, data, {
      ...config,
      headers: {
        ...config?.headers,
        "Content-Type": "multipart/form-data",
      },
    });
  };

  update = (url: string, data: any, config?: AxiosRequestConfig): Promise<any> => {
    return axios.patch(url, data, config);
  };

  patchWithFile = (url: string, data: FormData, config?: AxiosRequestConfig): Promise<any> => {
    return axios.patch(url, data, {
      ...config,
      headers: {
        ...config?.headers,
        "Content-Type": "multipart/form-data",
      },
    });
  };

  put = (url: string, data: any, config?: AxiosRequestConfig): Promise<any> => {
    return axios.put(url, data, config);
  };

  delete = (url: string, config?: AxiosRequestConfig): Promise<any> => {
    return axios.delete(url, config);
  };
}

const getLoggedinUser = () => {
  const user = sessionStorage.getItem("authUser");
  if (!user) return { data: null };

  try {
    const parsed = JSON.parse(user);
    // Handles both envelope shape { data: { ... } } and flat user object { ... }
    return parsed?.data ? parsed : { data: parsed };
  } catch (error) {
    console.error("Failed to parse authUser from sessionStorage:", error);
    return { data: null };
  }
};

export { APIClient, getLoggedinUser };