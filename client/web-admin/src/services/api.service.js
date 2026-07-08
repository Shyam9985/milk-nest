import axios from "../store/interceptor";

export async function get(relativeUrl, queryParams = {}) {
    const response = await axios.get(`${process.env.SERVER_URL}/${relativeUrl}`, {
        params: {
            ...queryParams
        }
    });

    return response;
}

export async function post(relativeUrl, payload) {
    const response = await axios.post(`${process.env.SERVER_URL}/${relativeUrl}`, payload);
    return response;
}

export async function put(relativeUrl, payload) {
    const response = await axios.put(`${process.env.SERVER_URL}/${relativeUrl}`, payload);
    return response;
}

export async function remove(relativeUrl, queryParams = {}) {
    const response = await axios.delete(`${process.env.SERVER_URL}/${relativeUrl}`, {
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