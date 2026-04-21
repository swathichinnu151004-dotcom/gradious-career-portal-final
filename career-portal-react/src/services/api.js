import axios from "axios";
import { getApiBaseUrl } from "../utils/getApiBaseUrl";

const API = axios.create({
  baseURL: getApiBaseUrl(),
});

API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

export default API;