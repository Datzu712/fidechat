export function httpErrorTranslate(code: number) {
    switch (code) {
        case 400:
            return {
                title: 'Bad Request',
                description:
                    'The server could not understand the request due to invalid syntax.',
            };
        case 401:
            return {
                title: 'Unauthorized',
                description:
                    'The client must authenticate itself to get the requested response.',
            };
        case 403:
            return {
                title: 'Forbidden',
                description:
                    'The client does not have access rights to the content.',
            };
        case 404:
            return {
                title: 'Not Found',
                description: 'The server can not find the requested resource.',
            };
        case 500:
            return {
                title: 'Internal Server Error',
                description:
                    'The server has encountered a situation it does not know how to handle.',
            };
        default:
            return {
                title: 'Error',
                description: 'An error occurred while processing your request.',
            };
    }
}
