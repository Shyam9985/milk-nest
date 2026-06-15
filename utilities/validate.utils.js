
const isRequired = (value) => {
    return value !== undefined &&
        value !== null &&
        String(value).trim() !== '';
};

const isValidMobile = (mobile) => {
    mobile = String(mobile).trim();
    return /^[6-9]\d{9}$/.test(mobile);
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

const isValidAadhaar = (aadhaar) => {

    aadhaar = String(aadhaar).replace(/\s/g, '');

    if (!/^\d{12}$/.test(aadhaar)) {
        return false;
    }

    let c = 0;

    const reversed = aadhaar.split('').reverse().map(Number);

    for (let i = 0; i < reversed.length; i++) {
        c = d[c][p[i % 8][reversed[i]]];
    }

    return c === 0;
};

const isValidPan = (pan) => {
    pan = String(pan).trim().toUpperCase();
    return /^[A-Z]{5}[0-9]{4}[A-Z]$/.test(pan);
};

const isValidEmail = (email) => {

    if (!email) return false;

    email = String(email).trim();

    const regex =
        /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)+$/;

    if (!regex.test(email)) {
        return false;
    }

    if (email.length > 254) {
        return false;
    }

    const [localPart, domain] = email.split('@');

    if (localPart.length > 64) {
        return false;
    }

    if (localPart.startsWith('.')
        || localPart.endsWith('.')
        || localPart.includes('..')) {
        return false;
    }

    if (domain.includes('..')) {
        return false;
    }

    return true;
};

const isValidAlpha = (value) => {
    return /^[A-Za-z\s]+$/.test(String(value));
};

const isValidAlphaNumeric = (value) => {
    return /^[A-Za-z0-9\s]+$/.test(String(value));
};

const isValidNumber = (value) => {
    return !isNaN(value) && value !== '';
};

const isPositiveNumber = (value) => {
    return Number(value) > 0;
};

const isNonNegativeNumber = (value) => {
    return Number(value) >= 0;
};

const isValidDecimal = (value) => {
    return /^\d+(\.\d+)?$/.test(String(value));
};

const isValidLength = (value, min = 0, max = Infinity) => {
    const len = String(value).trim().length;
    return len >= min && len <= max;
};

const isValidDate = (date) => {
    const parsed = new Date(date);
    return parsed instanceof Date
        && !isNaN(parsed);
};

const isValidBoolean = (value) => {
    return typeof value === 'boolean';
};

const isValidPersonName = (name) => {
    return /^[A-Za-z.\s]{2,100}$/.test(
        String(name).trim()
    );
};

const isValidAmount = (amount) => {
    return Number.isFinite(Number(amount))
        && Number(amount) >= 0;
};

const isValidInteger = (value) => {
    return Number.isInteger(Number(value));
};

const isPositiveInteger = (value) => {
    return Number.isInteger(Number(value))
        && Number(value) > 0;
};

const isValidPincode = (pincode) => {
    return /^[1-9][0-9]{5}$/.test(
        String(pincode)
    );
};

const isValidGstin = (gstin) => {
    gstin = String(gstin).trim().toUpperCase();
    return /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[A-Z0-9]{3}$/.test(gstin);
};

const isStrongPassword = (password) => {

    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,20}$/
        .test(password);
};

const isValidEnum = (value, allowedValues = []) => {
    return allowedValues.includes(value);
};

module.exports = {
    isRequired,
    isValidMobile,
    isValidAadhaar,
    isValidPan,
    isValidEmail,
    isValidPincode,
    isValidPersonName,
    isValidInteger,
    isPositiveInteger,
    isValidAmount,
    isValidDate,
    isStrongPassword,
    isValidEnum,
    isValidGstin
};