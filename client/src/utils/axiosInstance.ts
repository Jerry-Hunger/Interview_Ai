import axios from "axios";

const axiosInstance = axios.create({
  // 浏览器始终访问同源 API；开发时由 Vite 代理，生产时由 Nginx 反代。
  baseURL: "/api",
  withCredentials: true,
});

// Token 过期处理函数（导出供其他模块使用）
export const handleTokenExpiration = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("role");
  // 使用 window.location 跳转以确保页面完全刷新
  window.location.href = "/login?expired=true";
};

// 添加请求拦截器，自动携带 Authorization 头
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 添加响应拦截器，处理 401 错误（Token 过期或无效）
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    // 仅处理 401 错误（未授权/Token 过期）
    if (error.response?.status === 401) {
      const currentPath = window.location.pathname;
      // 避免在登录页重复处理
      if (currentPath !== "/login" && currentPath !== "/register") {
        handleTokenExpiration();
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
