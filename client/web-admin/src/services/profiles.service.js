import { get } from "../store/api.service";

// one call serves every profile type; the server's registry decides the shape returned
export async function getEntityProfile(type, id) {
    try {
        return await get(`profiles/${type}/${id}`);
    } catch (error) {
        return error;
    }
}
