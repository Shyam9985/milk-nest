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

let logoutHandler = null;

export function registerLogoutHandler(handler) {
    logoutHandler = handler;
}

function handleLogout() {
    if (logoutHandler) {
        logoutHandler();
    }
}

// Reads the issued-at claim of a JWT. Returns 0 for missing/malformed tokens
// so any valid token always wins against "no token".
function tokenIat(token) {
    try {
        // JWT payloads are base64url encoded; atob only understands base64
        const payload = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
        return JSON.parse(atob(payload)).iat || 0;
    } catch (error) {
        return 0;
    }
}

axiosInstance.interceptors.request.use((config) => {
    // add authentication token to headers
    const token = localStorage.getItem("access-token");

    if (token) {
        config.headers['access-token'] = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

axiosInstance.interceptors.response.use(

    (response) => {
        // console.log("URL:", response.config.url);
        // console.log("STATUS:", response.status);
        // Set jwt token in local storage 
        const jwtToken = response.headers['access-token'];

        const localToken = localStorage.getItem("access-token");

        // Only ever replace the stored token with a strictly NEWER one.
        if (jwtToken && tokenIat(jwtToken) > tokenIat(localToken)) {
            // console.log('setting new jwt token', jwtToken);

            localStorage.setItem("access-token", jwtToken);
        }

        // Refresh access token if server issued a new one
        const refreshToken = response.headers["new-access-token"];

        // console.log(refreshToken);

        if (refreshToken && tokenIat(refreshToken) > tokenIat(localToken)) {
            // console.log('setting refresh token', refreshToken);

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
        // console.log(data);


        switch (data.statusKey) {
            case "TOKEN_EXPIRED":
            case "SESSION_EXPIRED":
                console.log('user shold be logged out!');

                // Clear authentication data
                localStorage.removeItem("access-token");
                handleLogout();

                break;

            default:
                // Let the calling component handle it
                break;
        }

        return Promise.reject(data);
    }
);

export default axiosInstance;
