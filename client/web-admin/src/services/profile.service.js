import { get } from "../store/api.service";

export async function getProfile() {
    try {
        const response = await get('profile');
        return response;
    } catch (error) {
        return error;
    }
}
