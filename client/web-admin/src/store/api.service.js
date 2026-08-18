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

// raw-body upload: the payload rides as-is (e.g. a File/Blob), with per-request headers.
// uploads can honestly outlive the instance's 30s default, so they get their own timeout
export async function upload(relativeUrl, payload, headers = {}, onUploadProgress) {
    const response = await axios.post(relativeUrl, payload, { headers, onUploadProgress, timeout: 120000 });
    return response;
}

// binary download: resolves to a Blob instead of parsed JSON (interceptor unwraps .data)
export async function download(relativeUrl) {
    const response = await axios.get(relativeUrl, { responseType: "blob" });
    return response;
}
