import { upload, download } from "../store/api.service";

// fetches the logged in user's current profile photo as a Blob;
// null means "no photo / fetch failed" — the caller falls back to initials
export async function getProfilePhoto() {
    try {
        const blob = await download("files/profile-photo");
        console.log("[download] received blob — bytes:", blob?.size, "| type:", blob?.type, "| lives in browser memory only");
        return blob instanceof Blob ? blob : null;
    } catch {
        console.log("[download] no photo available (or fetch failed)");
        return null;
    }
}

// the file itself is the raw request body (no FormData) so the server can
// read the byte stream directly; metadata travels in headers
export async function uploadFile(file, onProgress) {
    console.log(`[upload] sending '${file.name}' — ${file.size} bytes, ${file.type}; the browser streams it from disk`);

    try {
        return await upload(
            "files/upload",
            file,
            {
                "Content-Type": file.type || "application/octet-stream",
                "x-file-name": encodeURIComponent(file.name),
            },
            (event) => {
                // translate axios's byte counts into a plain percentage so
                // components never deal with transport details
                if (event.total) {
                    const pct = Math.round((event.loaded / event.total) * 100);
                    console.log(`[upload] progress ${pct}% (${event.loaded}/${event.total} bytes handed to the network)`);
                    onProgress?.(pct);
                }
            }
        );
    } catch (error) {
        return error;
    }
}
