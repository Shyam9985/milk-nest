import { post, get } from "../store/api.service";


export async function handleLogin(formData) {
    let data = null;
    try {
        // console.log('in handle login service', formData);
        const response = await post('auth/login', formData);
        // console.log(response);
        data = response;

    } catch (error) {
        // console.log(error);
        data = error;
    }
    return data;
}

export async function handleLogout() {
    try {
        const user = localStorage.getItem('user-data');
        const response = await post('auth/logout', user);
        // console.log(response);
        return response;
    } catch (error) {
        // console.log(error);
        return error;
    }
}

export async function getMenuItems() {
    try {
        const response = await get('admin/menu-items');
        return response
    } catch (error) {
        return error
    }
}

export async function getSetupMenus() {
    try {
        const response = await get('admin/setup-menus');
        return response;
    } catch (error) {
        return error;
    }
}

export async function getGenderOptions() {
    try {
        const response = await get('admin/genders');
        return response;
    } catch (error) {
        return error;
    }
}

export async function sendForgotPasswordEmail(email) {
    try {
        const response = await post('/auth/forgot-password', { email: email });
        return response
    } catch (error) {
        return error;
    }
}

export async function verifyForgotPasswordOtp(body) {
    try {
        const response = await post('auth/email/verify-otp', { email: body.email, otp: body.otp, message_key: body.key });
        return response;
    } catch (error) {
        return error
    }

}

export async function updatePassword(body) {
    try {
        const response = await post('auth/update-password', {
            email: body.email,
            usedFor: body?.usedFor || 'forgot-password',
            newPassword: body.newPassword,
            otpKey: body.otpKey
        });
        return response;
    } catch (error) {
        return error;
    }
}

export async function resetPasswordMail() {
    try {
        const response = await get('auth/reset-password/send-email');
        return response;
    } catch (error) {
        return error;
    }
}