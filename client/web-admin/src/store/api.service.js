import axios from "./interceptor";
import crypto from "crypto-js";

// pendingRequests map 
const pendingRequests = new Map();

// request id generator function for repventing duplicates 
function generateRequestId({ method, path, params, payload }) {
    const text = method + path + JSON.stringify(params) + JSON.stringify(payload);
    return crypto.SHA256(text).toString(crypto.enc.Hex);
}

// insert pending request to the map
function upsertPendingRequest(requestId, promise) {
    pendingRequests.set(requestId, promise);
}

// remove pending request from the map
function removePendingRequest(requestId) {
    pendingRequests.delete(requestId);
}

// check if already request processing
function checkIfRequestExists(requestId) {
    return pendingRequests.has(requestId);
}

// get the request promise
function getExistingRequestPromise(requestId) {
    return pendingRequests.get(requestId);
}

export async function get(relativeUrl, queryParams = {}) {
    const requestId = generateRequestId({ method: 'GET', path: relativeUrl, params: queryParams, payload: '' });

    // validate request
    if (checkIfRequestExists(requestId)) {
        console.log('using existing promise:', requestId);
        return getExistingRequestPromise(requestId);
    }

    // ceate new axios promise 
    const requestPromise = axios.get(relativeUrl, {
        params: {
            ...queryParams
        }
    });

    // add pending request into map 
    upsertPendingRequest(requestId, requestPromise);

    // wait for the response 
    try {
        return await requestPromise;
    } finally {
        removePendingRequest(requestId);
    }
}

export async function post(relativeUrl, payload) {
   const requestId = generateRequestId({ method: 'POST', path: relativeUrl, params: '', payload: payload });

    // validate request
    if (checkIfRequestExists(requestId)) {
        console.log('using existing promise:', requestId);
        return getExistingRequestPromise(requestId);
    }
    // ceate new axios promise 
    const requestPromise = axios.post(relativeUrl, payload);

    // add pending request into map 
    upsertPendingRequest(requestId, requestPromise);

    // wait for the response 
    try {
        return await requestPromise;
    } finally {
        removePendingRequest(requestId);
    }
}

export async function put(relativeUrl, payload) {
    const requestId = generateRequestId({ method: 'PUT', path: relativeUrl, params: '', payload: payload });

    // validate request
    if (checkIfRequestExists(requestId)) {
        console.log('using existing promise:', requestId);
        return getExistingRequestPromise(requestId);
    }
    // ceate new axios promise 
    const requestPromise = axios.put(relativeUrl, payload);

    // add pending request into map 
    upsertPendingRequest(requestId, requestPromise);

    // wait for the response 
    try {
        return await requestPromise;
    } finally {
        removePendingRequest(requestId);
    }
}

export async function remove(relativeUrl, queryParams = {}) {
   const requestId = generateRequestId({ method: 'DELETE', path: relativeUrl, params: queryParams, payload: '' });

    // validate request
    if (checkIfRequestExists(requestId)) {
        console.log('using existing promise:', requestId);
        return getExistingRequestPromise(requestId);
    }

    // ceate new axios promise 
    const requestPromise = axios.delete(relativeUrl, {
        params: {
            ...queryParams
        }
    });

    // add pending request into map 
    upsertPendingRequest(requestId, requestPromise);

    // wait for the response 
    try {
        return await requestPromise;
    } finally {
        removePendingRequest(requestId);
    }
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
