export const SESSION_COOKIE = 'fidechat_sid';
export const LOGIN_STATE_COOKIE = 'fidechat_login_state';

export function readCookie(header: string | undefined, name: string): string | undefined {
    for (const part of header?.split(';') ?? []) {
        const [key, ...value] = part.trim().split('=');
        if (key !== name) continue;
        try {
            return decodeURIComponent(value.join('='));
        } catch {
            return undefined; // Malformed percent-encoding: treat the cookie as absent.
        }
    }
    return undefined;
}

/** Builds an HttpOnly, SameSite=Lax Set-Cookie value. A `maxAge` of 0 deletes the cookie. */
export function serializeCookie(name: string, value: string, maxAge: number, path: string, secure: boolean): string {
    const flags = `HttpOnly; SameSite=Lax${secure ? '; Secure' : ''}`;
    return `${name}=${encodeURIComponent(value)}; Path=${path}; Max-Age=${maxAge}; ${flags}`;
}
