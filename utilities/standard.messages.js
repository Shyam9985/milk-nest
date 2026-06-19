const RESPONSE_STATUS = {
    SUCCESS: {
        code: 200,
        message: 'Request processed successfully.'
    },

    CREATED: {
        code: 201,
        message: 'Resource created successfully.'
    },

    UPDATED: {
        code: 200,
        message: 'Resource updated successfully.'
    },

    DELETED: {
        code: 200,
        message: 'Resource deleted successfully.'
    },

    DATA_FOUND: {
        code: 200,
        message: 'Data retrieved successfully.'
    },

    NO_DATA_FOUND: {
        code: 404,
        message: 'No data found.'
    },

    INVALID_REQUEST: {
        code: 400,
        message: 'Invalid request.'
    },

    VALIDATION_ERROR: {
        code: 400,
        message: 'Validation failed for requested data.'
    },

    UNAUTHORIZED: {
        code: 401,
        message: 'Unauthorized access.'
    },

    NO_SELECT_PERMISSION: {
        code: 403,
        message: 'You do not have permission to view this resource.'
    },

    NO_INSERT_PERMISSION: {
        code: 403,
        message: 'You do not have permission to create this resource.'
    },

    NO_UPDATE_PERMISSION: {
        code: 403,
        message: 'You do not have permission to update this resource.'
    },

    NO_DELETE_PERMISSION: {
        code: 403,
        message: 'You do not have permission to delete this resource.'
    },

    FORBIDDEN: {
        code: 403,
        message: 'Access denied.'
    },

    DUPLICATE_RECORD: {
        code: 409,
        message: 'Record already exists with the given details.'
    },

    NOT_FOUND: {
        code: 404,
        message: 'Requested resource not found.'
    },

    DB_ERROR: {
        code: 500,
        message: 'Database operation failed.'
    },

    INVALID_DATA_FORMAT: {
        code: 405,
        message: "Data send in wrong format"
    },
    INVALID_DATA: {
        code: 405,
        message: "Invalid data has been sent. please check."
    },

    REQUIRED_FIELDS_MISSING: {
        code: 405,
        message: "Please fill the required fields/vlid input data and try again"
    },

    UN_AUTH_ACCESS: {
        code: 401,
        message: "Unauthorized access/attempt. Please check and retry"
    },

    INVALID_OTP: {
        code: 401,
        message: "Invalid/ Expired OTP"
    },

    VALID_OTP: {
        code: 200,
        message: "OTP Validated successfully."
    },

    INVALID_CREDENTIALS: {
        code: 401,
        message: "Invalid credentials.Please retry"
    },

    TEMPORARLY_LOCKED: {
        code: 401,
        message: "Account is temporarly locaked.please try after some time."
    },

    SESSION_ERR: {
        code: 408,
        message: "Session Database Query/Connection Error"
    },

    TOOMANY_ATTEMPTS: {
        code: 409,
        message: "Too many wrong attempts. Please try after 24hrs/contact support."
    },

    SESSION_EXPIRED: {
        code: 403,
        message: "Session expired. Please login again."
    },

    INVALID_TOKEN: {
        code: 403,
        message: "Invalid token sent. Please provide a valid token."
    },


    TOKEN_EXPIRED: {
        code: 403,
        message: "Token expired. Please login again."
    },

    UNAUTHORISED_URL: {
        code: 401,
        message: "Unauthorized URL. Access denied."
    },

    INTERNAL_SERVER_ERROR: {
        code: 500,
        message: 'Internal server error.'
    },

    SERVICE_UNAVAILABLE: {
        code: 503,
        message: 'Service temporarily unavailable.'
    },

    DB_QUERY_ISSUE: {
        code: 700,
        message: "Database Query/Connection Error"
    },

    MODEL_ERR: {
        code: 700,
        message: "Something went wrong"
    },

    SYNTAX_ERROR: {
        code: 701,
        message: "Something went wrong. The error is reported to the administrator."
    },

    UNABLE_TO_PROCESS: {
        code: 400,
        message: "Unable to process request at the moment."
    },

    UNABLE_TO_SEND_EMAIL: {
        code: 400,
        message: "Unable to send email. Please try again."
    },

    EMAIL_SENT: {
        code: 200,
        message: "Email sent successfully."
    },

    PASSWORD_UPDATED: {
        code: 200,
        message: 'Password updated successfully.'
    }
};

module.exports = RESPONSE_STATUS;