import axios, { AxiosRequestConfig, AxiosResponse } from "axios";
import config from "../config";

const { api } = config;

axios.defaults.baseURL = api.API_URL;
axios.defaults.headers.post["Content-Type"] = "application/json";
axios.defaults.withCredentials = true;

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

axios.interceptors.response.use(
  (response: AxiosResponse) => (response.data ? response.data : response),
  async (error: any) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (originalRequest.url.includes("/login")) {
        return Promise.reject(error); 
      }

      if (originalRequest.url.includes("/refresh")) {
        sessionStorage.removeItem("authUser");
        window.location.href = "/login";
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => axios(originalRequest))
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        await axios.post("/refresh");
        processQueue(null);
        return axios(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        sessionStorage.removeItem("authUser");
        window.location.href = "/login";
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
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
  return user ? JSON.parse(user) : null;
};

export { APIClient, getLoggedinUser };