import axios from "axios";
import { config } from "dotenv";

const axiosInstance = axios.create({
    baseURL: process.env.SERVER_URL + 'apiv1/',
    headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
    },
    sensitiveHeaders: ["access-token",],
    maxBodyLength: 100 * 1024 * 1024, // 100 MB
    maxContentLength: 100 * 1024 * 1024, // 100 MB
    withCredentials: true,
    parseReviver: (key, value) => {
        if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value)) {
            return new Date(value);
        }
        return value;
    },
    timeout: 30000, // 30 seconds
});

axiosInstance.interceptors.request.use((config) => {
    // add authentication token to headers
    const token = localStorage.getItem("access-token");

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

axiosInstance.interceptors.response.use((response) => {

    // set new access token if present in response headers
    const newAccessToken = response.headers['new-access-token'];
    if (newAccessToken && newAccessToken !== localStorage.getItem("access-token")) {
        localStorage.setItem("access-token", newAccessToken);
    }
    return response;
}, (error) => {

    return Promise.reject(error);
});

export default axiosInstance;
