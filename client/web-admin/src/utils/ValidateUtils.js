const success = () => ({
    status: true,
    message: null
});

const failure = (message) => ({
    status: false,
    message
});

export const isRequired = (value, { label = 'Value' } = {}) => {

    if (value === undefined || value === null) {
        return failure(`${label} is required.`);
    }

    if (typeof value === 'string' && value.trim() === '') {
        return failure(`${label} cannot be empty.`);
    }

    if (Array.isArray(value) && value.length === 0) {
        return failure(`${label} cannot be an empty array.`);
    }

    if (
        typeof value === 'object' &&
        !Array.isArray(value) &&
        Object.keys(value).length === 0
    ) {
        return failure(`${label} cannot be an empty object.`);
    }

    if (typeof value === 'number' && Number.isNaN(value)) {
        return failure(`${label} must be a valid number.`);
    }

    return success();
};

export const isValidMobile = (mobile, { label = 'Mobile number' } = {}) => {

    mobile = String(mobile).trim();

    if (mobile === '') {
        return failure(`${label} is required.`);
    }

    if (!/^\d+$/.test(mobile)) {
        return failure(`${label} should contain only digits.`);
    }

    if (mobile.length !== 10) {
        return failure(`${label} should contain exactly 10 digits.`);
    }

    if (!/^[6-9]/.test(mobile)) {
        return failure(`${label} should start with digits 6 to 9.`);
    }

    return success();
};

const d = [
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
    [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
    [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
    [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
    [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
    [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
    [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
    [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
    [9, 8, 7, 6, 5, 4, 3, 2, 1, 0]
];

const p = [
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
    [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
    [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
    [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
    [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
    [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
    [7, 0, 4, 6, 9, 1, 3, 2, 5, 8]
];

export const isValidAadhaar = (aadhaar, { label = 'Aadhaar Number' } = {}) => {

    aadhaar = String(aadhaar).replace(/\s/g, '');

    if (aadhaar === '') {
        return failure(`${label} is required.`);
    }

    if (!/^\d+$/.test(aadhaar)) {
        return failure(`${label} should contain only digits.`);
    }

    if (aadhaar.length !== 12) {
        return failure(`${label} should contain exactly 12 digits.`);
    }

    let c = 0;

    const reversed = aadhaar
        .split('')
        .reverse()
        .map(Number);

    for (let i = 0; i < reversed.length; i++) {
        c = d[c][p[i % 8][reversed[i]]];
    }

    if (c !== 0) {
        return failure(`${label} is invalid.`);
    }

    return success();
}


export const isValidPan = (pan, { label = 'PAN number' } = {}) => {

    pan = String(pan).trim().toUpperCase();

    if (pan === '') {
        return failure(`${label} is required.`);
    }

    if (pan.length !== 10) {
        return failure(`${label} should contain exactly 10 characters.`);
    }

    if (!/^[A-Z]{5}/.test(pan)) {
        return failure(`${label} should begin with 5 uppercase letters.`);
    }

    if (!/^[A-Z]{5}[0-9]{4}/.test(pan)) {
        return failure(`${label} should contain 4 digits after the first 5 letters.`);
    }

    if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(pan)) {
        return failure(`${label} should end with one uppercase letter.`);
    }

    return success();
};

export const isValidEmail = (email, { label = 'Email address' } = {}) => {

    if (email === undefined || email === null) {
        return failure(`${label} is required.`);
    }

    email = String(email).trim();

    if (email === '') {
        return failure(`${label} cannot be empty.`);
    }

    if (email.length > 254) {
        return failure(`${label} cannot exceed 254 characters.`);
    }

    const regex =
        /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)+$/;

    if (!regex.test(email)) {
        return failure(`Please enter a valid ${label.toLowerCase()}.`);
    }

    const [localPart, domain] = email.split('@');

    if (localPart.length > 64) {
        return failure(`The username part of the ${label.toLowerCase()} cannot exceed 64 characters.`);
    }

    if (localPart.startsWith('.')) {
        return failure(`${label} cannot start with a period (.).`);
    }

    if (localPart.endsWith('.')) {
        return failure(`${label} cannot end with a period (.).`);
    }

    if (localPart.includes('..')) {
        return failure(`${label} cannot contain consecutive periods.`);
    }

    if (domain.includes('..')) {
        return failure(`${label} contains an invalid domain.`);
    }

    return success();
};

export const isValidAlpha = (value, { label = 'Value', allowSpaces = true } = {}) => {

    value = String(value).trim();

    if (value === '') {
        return failure(`${label} is required.`);
    }

    const regex = allowSpaces
        ? /^[A-Za-z\s]+$/
        : /^[A-Za-z]+$/;

    if (!regex.test(value)) {
        return failure(
            allowSpaces
                ? `${label} should contain only alphabets and spaces.`
                : `${label} should contain only alphabets.`
        );
    }

    return success();
};


export const isValidAlphaNumeric = (value, { label = 'Value', allowSpaces = true } = {}) => {

    value = String(value).trim();

    if (value === '') {
        return failure(`${label} is required.`);
    }

    const regex = allowSpaces
        ? /^[A-Za-z0-9\s]+$/
        : /^[A-Za-z0-9]+$/;

    if (!regex.test(value)) {
        return failure(
            allowSpaces
                ? `${label} should contain only alphabets, numbers and spaces.`
                : `${label} should contain only alphabets and numbers.`
        );
    }

    return success();
};

export const isValidNumber = (value, { min = null, max = null, allowDecimal = true, label = 'Value' } = {}) => {

    if (value === '' || value === null || value === undefined) {
        return failure(`${label} is required.`);
    }

    if (isNaN(value)) {
        return failure(`${label} must be a valid number.`);
    }

    value = Number(value);

    if (!allowDecimal && !Number.isInteger(value)) {
        return failure(`${label} must be a whole number.`);
    }

    if (min !== null && value < min) {
        return failure(`${label} must be greater than or equal to ${min}.`);
    }

    if (max !== null && value > max) {
        return failure(`${label} must be less than or equal to ${max}.`);
    }

    return success();
};

export const isPositiveNumber = (value, { label = 'Value' } = {}) => {

    if (value === '' || value === null || value === undefined) {
        return failure(`${label} is required.`);
    }

    if (isNaN(value)) {
        return failure(`${label} must be a valid number.`);
    }

    value = Number(value);

    if (value <= 0) {
        return failure(`${label} must be greater than zero.`);
    }

    return success();
};

export const isNonNegativeNumber = (value, { label = 'Value' } = {}) => {

    if (value === '' || value === null || value === undefined) {
        return failure(`${label} is required.`);
    }

    if (isNaN(value)) {
        return failure(`${label} must be a valid number.`);
    }

    value = Number(value);

    if (value < 0) {
        return failure(`${label} cannot be negative.`);
    }

    return success();
};

export const isValidDecimal = (value, { label = 'Value', precision = null } = {}) => {

    value = String(value).trim();

    if (value === '') {
        return failure(`${label} is required.`);
    }

    if (!/^\d+(\.\d+)?$/.test(value)) {
        return failure(`${label} must be a valid decimal number.`);
    }

    if (precision !== null) {

        const decimalPart = value.split('.')[1] || '';

        if (decimalPart.length > precision) {
            return failure(
                `${label} can contain a maximum of ${precision} decimal places.`
            );
        }
    }

    return success();
};

export const isValidLength = (value, { min = 0, max = Infinity, trim = true, label = 'Value' } = {}) => {

    if (value === undefined || value === null) {
        return failure(`${label} is required.`);
    }

    value = String(value);

    if (trim) {
        value = value.trim();
    }

    const len = value.length;

    if (len < min) {
        return failure(`${label} must contain at least ${min} characters.`);
    }

    if (len > max) {
        return failure(`${label} cannot exceed ${max} characters.`);
    }

    return success();
};

export const isValidDate = (date, { label = 'Date', min = null, max = null } = {}) => {

    if (!date) {
        return failure(`${label} is required.`);
    }

    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) {
        return failure(`${label} is invalid.`);
    }

    if (min && parsed < new Date(min)) {
        return failure(`${label} should not be before ${min}.`);
    }

    if (max && parsed > new Date(max)) {
        return failure(`${label} should not be after ${max}.`);
    }

    return success();
};

export const isValidBoolean = (value, { label = 'Value' } = {}) => {

    if (typeof value !== 'boolean') {
        return failure(`${label} must be either true or false.`);
    }

    return success();
};

export const isValidPersonName = (name, { label = 'Name', minLength = 2, maxLength = 100 } = {}) => {

    if (!name) {
        return failure(`${label} is required.`);
    }

    name = String(name).trim();

    if (name.length < minLength) {
        return failure(`${label} must contain at least ${minLength} characters.`);
    }

    if (name.length > maxLength) {
        return failure(`${label} cannot exceed ${maxLength} characters.`);
    }

    if (!/^[A-Za-z.\s]+$/.test(name)) {
        return failure(`${label} should contain only alphabets, spaces and periods.`);
    }

    return success();
};

export const isValidAmount = (amount, { label = 'Amount', min = 0, max = null } = {}) => {

    if (amount === '' || amount === null || amount === undefined) {
        return failure(`${label} is required.`);
    }

    if (isNaN(amount)) {
        return failure(`${label} must be a valid amount.`);
    }

    amount = Number(amount);

    if (amount < min) {
        return failure(`${label} must be at least ${min}.`);
    }

    if (max !== null && amount > max) {
        return failure(`${label} cannot exceed ${max}.`);
    }

    return success();
};

export const isValidInteger = (value, { label = 'Value' } = {}) => {

    if (value === '' || value === null || value === undefined) {
        return failure(`${label} is required.`);
    }

    if (isNaN(value)) {
        return failure(`${label} must be a valid number.`);
    }

    if (!Number.isInteger(Number(value))) {
        return failure(`${label} must be a whole number.`);
    }

    return success();
};

export const isPositiveInteger = (value, { label = 'Value' } = {}) => {

    const result = isValidInteger(value, { label });

    if (!result.status) {
        return result;
    }

    if (Number(value) <= 0) {
        return failure(`${label} must be greater than zero.`);
    }

    return success();
};

export const isValidPincode = (pincode, { label = 'Pincode' } = {}) => {

    pincode = String(pincode).trim();

    if (pincode === '') {
        return failure(`${label} is required.`);
    }

    if (!/^\d+$/.test(pincode)) {
        return failure(`${label} should contain only digits.`);
    }

    if (pincode.length !== 6) {
        return failure(`${label} should contain exactly 6 digits.`);
    }

    if (pincode.startsWith('0')) {
        return failure(`${label} cannot start with 0.`);
    }

    return success();
};

export const isValidGstin = (gstin, { label = 'GSTIN' } = {}) => {

    gstin = String(gstin).trim().toUpperCase();

    if (gstin === '') {
        return failure(`${label} is required.`);
    }

    if (gstin.length !== 15) {
        return failure(`${label} should contain exactly 15 characters.`);
    }

    if (!/^[0-9]{2}/.test(gstin)) {
        return failure(`${label} should begin with a valid state code.`);
    }

    if (!/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][A-Z0-9]{3}$/.test(gstin)) {
        return failure(`${label} format is invalid.`);
    }

    return success();
}

export const isStrongPassword = (password, { label = 'Password', minLength = 8, maxLength = 20 } = {}) => {

    if (!password) {
        return failure(`${label} is required.`);
    }

    password = String(password);

    if (password.length < minLength) {
        return failure(`${label} must contain at least ${minLength} characters.`);
    }

    if (password.length > maxLength) {
        return failure(`${label} cannot exceed ${maxLength} characters.`);
    }

    if (!/[a-z]/.test(password)) {
        return failure(`${label} must contain at least one lowercase letter.`);
    }

    if (!/[A-Z]/.test(password)) {
        return failure(`${label} must contain at least one uppercase letter.`);
    }

    if (!/\d/.test(password)) {
        return failure(`${label} must contain at least one digit.`);
    }

    if (!/[@$!%*?&]/.test(password)) {
        return failure(`${label} must contain at least one special character (@$!%*?&).`);
    }

    return success();
};

export const isValidString = (value, { minLength = 0, maxLength = Infinity, allowEmpty = false, trim = true, pattern = null, label = 'Value' } = {}) => {
    if (value === undefined || value === null) {
        return failure(`${label} is required.`);
    }

    if (typeof value !== 'string') {
        return failure(`${label} must be a valid string.`);
    }

    if (trim) {
        value = value.trim();
    }

    if (!allowEmpty && value === '') {
        return failure(`${label} cannot be empty.`);
    }

    if (value.length < minLength) {
        return failure(`${label} must contain at least ${minLength} characters.`);
    }

    if (value.length > maxLength) {
        return failure(`${label} cannot exceed ${maxLength} characters.`);
    }

    if (pattern && !pattern.test(value)) {
        return failure(`${label} format is invalid.`);
    }

    return success();
};

export const isValidObject = (value, { allowEmpty = false, minKeys = 0, maxKeys = Infinity, label = 'Object' } = {}) => {

    if (value === null || value === undefined) {
        return failure(`${label} is required.`);
    }

    if (typeof value !== 'object' || Array.isArray(value)) {
        return failure(`${label} must be a valid object.`);
    }

    const keyCount = Object.keys(value).length;

    if (!allowEmpty && keyCount === 0) {
        return failure(`${label} cannot be empty.`);
    }

    if (keyCount < minKeys) {
        return failure(`${label} must contain at least ${minKeys} properties.`);
    }

    if (keyCount > maxKeys) {
        return failure(`${label} cannot contain more than ${maxKeys} properties.`);
    }

    return success();
};

export const isValidArray = (value, { minItems = 0, maxItems = Infinity, allowEmpty = false, label = 'Array' } = {}
) => {

    if (!Array.isArray(value)) {
        return failure(`${label} must be an array.`);
    }

    if (!allowEmpty && value.length === 0) {
        return failure(`${label} cannot be empty.`);
    }

    if (value.length < minItems) {
        return failure(`${label} must contain at least ${minItems} item(s).`);
    }

    if (value.length > maxItems) {
        return failure(`${label} cannot contain more than ${maxItems} item(s).`);
    }

    return success();
}

export const isValidUrl = (value, { label = 'URL' } = {}) => {

    if (!value) {
        return failure(`${label} is required.`);
    }

    try {

        new URL(value);

        return success();

    } catch {

        return failure(`${label} is invalid.`);
    }
}

export const isValidFileExtension = (fileName, { extensions = [], label = 'File' } = {}) => {

    if (!fileName) {
        return failure(`${label} is required.`);
    }

    const extension = fileName
        .split('.')
        .pop()
        .toLowerCase();

    if (!extensions.includes(extension)) {

        return failure(
            `${label} should be one of: ${extensions.join(', ')}.`
        );
    }

    return success();
}

export const isValidFileSize = (file, { maxSizeMB = 5, label = 'File' } = {}) => {

    if (!file) {
        return failure(`${label} is required.`);
    }

    const maxBytes = maxSizeMB * 1024 * 1024;

    if (file.size > maxBytes) {

        return failure(
            `${label} should not exceed ${maxSizeMB} MB.`
        );
    }

    return success();
}

export const isValidAge = (age, { min = 0, max = 150, label = 'Age' } = {}) => {

    const result = isValidInteger(age, { label });

    if (!result.status) {
        return result;
    }

    age = Number(age);

    if (age < min) {
        return failure(`${label} should be at least ${min}.`);
    }

    if (age > max) {
        return failure(`${label} should not exceed ${max}.`);
    }

    return success();
}

export const isFutureDate = (date, { label = 'Date' } = {}) => {

    const result = isValidDate(date, { label });

    if (!result.status) {
        return result;
    }

    if (new Date(date) <= new Date()) {
        return failure(`${label} should be a future date.`);
    }

    return success();
}

export const isPastDate = (date, { label = 'Date' } = {}) => {
    const result = isValidDate(date, { label });

    if (!result.status) {
        return result;
    }

    if (new Date(date) >= new Date()) {
        return failure(`${label} should be a past date.`);
    }

    return success();
}