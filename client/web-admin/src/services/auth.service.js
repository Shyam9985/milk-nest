import { post } from "../store/api.service";


export async function handleLogin(formData) {
    let data = null;
    try {
        console.log('in handle login service', formData);
        const response = await post('auth/login', formData);
        console.log(response);
        data = response;

    } catch (error) {
        console.log(error);
        data = error;
    }
    return data;
}