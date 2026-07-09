import axios from "./interceptor";

export async function get(relativeUrl, queryParams = {}) {
    const response = await axios.get(relativeUrl, {
        params: {
            ...queryParams
        }
    });

    return response;
}

export async function post(relativeUrl, payload) {
    const response = await axios.post(relativeUrl, payload);
    return response;
}

export async function put(relativeUrl, payload) {
    const response = await axios.put(relativeUrl, payload);
    return response;
}

export async function remove(relativeUrl, queryParams = {}) {
    const response = await axios.delete(relativeUrl, {
        params: {
            ...queryParams
        }
    });
    return response;
}

export async function upload(url, formData) {

    const response = await axiosInstance.post(url, formData, {
        headers: {
            "Content-Type": "multipart/form-data", "Accept": "application/json"
        }
    });

    return response.data;
}