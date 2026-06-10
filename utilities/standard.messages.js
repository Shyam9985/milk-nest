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
        message: 'Validation failed.'
    },

    UNAUTHORIZED: {
        code: 401,
        message: 'Unauthorized access.'
    },

    FORBIDDEN: {
        code: 403,
        message: 'Access denied.'
    },

    DUPLICATE_RECORD: {
        code: 409,
        message: 'Record already exists.'
    },

    NOT_FOUND: {
        code: 404,
        message: 'Requested resource not found.'
    },

    DB_ERROR: {
        code: 500,
        message: 'Database operation failed.'
    },

    INTERNAL_SERVER_ERROR: {
        code: 500,
        message: 'Internal server error.'
    },

    SERVICE_UNAVAILABLE: {
        code: 503,
        message: 'Service temporarily unavailable.'
    }
};

module.exports = RESPONSE_STATUS;