import axios from "axios";

const axiosInstance = axios.create({
    baseURL: process.env.REACT_APP_SERVER_URL + '/apiv1/',
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

axiosInstance.interceptors.response.use(

    (response) => {


        // Set jwt token in local storage 
        const jwtToken = response.headers['access-token']
        const localToken = localStorage.getItem("access-token");
        
        if (jwtToken && localToken !== jwtToken) {
            localStorage.setItem("access-token", jwtToken);
        }

        // Refresh access token if server issued a new one
        const refreshToken = response.headers["new-access-token"];


        if (refreshToken && refreshToken !== localToken) {
            localStorage.setItem("access-token", refreshToken);
        }
        return response.data;
    },
    (error) => {

        // Network / CORS / Server unreachable
        if (!error.response) {
            return Promise.reject({
                success: false,
                code: 0,
                statusKey: "NETWORK_ERROR",
                message: "Unable to connect to the server.",
                error: error.message
            });
        }

        const { data } = error.response;
        console.log(data);


        switch (data.statusKey) {

            case "TOKEN_EXPIRED":
            case "SESSION_EXPIRED":
            case "INVALID_TOKEN":
            case "UNAUTHORIZED":
            case "UN_AUTH_ACCESS":

                // Clear authentication data
                localStorage.removeItem("access-token");

                // Notify AuthContext
                window.dispatchEvent(new Event("logout"));

                break;

            default:
                // Let the calling component handle it
                break;
        }

        return Promise.reject(data);
    }
);

export default axiosInstance;
