import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import jwt from 'jsonwebtoken';
import jwksClient, { type JwksClient } from 'jwks-rsa';

/** The API's identifier in the access token `aud` claim (RFC 9700 §2.3), added by a Keycloak Audience mapper. */
export const API_AUDIENCE = 'urn:fidechat:api';

/**
 * Verifies Keycloak access tokens locally against the realm JWKS: signature (RS256), issuer,
 * audience (`API_AUDIENCE`) and expiry, plus `typ: Bearer` so an ID token (same key, same issuer)
 * is not accepted as an access token. There is no introspection, so a revoked token stays valid until it expires.
 */
@Injectable()
export class TokenVerifier {
    private readonly jwks: JwksClient;
    readonly issuer: string;

    constructor(config: ConfigService<IEnvironmentVariables>) {
        this.issuer = `${config.getOrThrow('PUBLIC_KEYCLOAK_URL')}/realms/${config.getOrThrow('KEYCLOAK_REALM')}`;
        this.jwks = jwksClient({ jwksUri: `${this.issuer}/protocol/openid-connect/certs` });
    }

    // technically you need to fetch the JWKS to be able to verify the token so its not really offline but yeah whatever bro
    async offline(token: string): Promise<IReqUser> {
        const decoded = jwt.decode(token, { complete: true });
        if (!decoded) throw new Error('Malformed JWT');

        const key = await this.jwks.getSigningKey(decoded.header.kid);
        const payload = jwt.verify(token, key.getPublicKey(), {
            algorithms: ['RS256'],
            issuer: this.issuer,
            audience: API_AUDIENCE,
        });
        if (typeof payload === 'string' || payload.typ !== 'Bearer' || typeof payload.sub !== 'string') {
            throw new Error('Not an access token');
        }
        return payload as IReqUser;
    }

    /**
     * Verifies an ID token for `clientId` (OIDC Core §3.1.3.7): signature, issuer, expiry,
     * `aud` = `clientId`, `azp` if present, and `typ: ID`.
     */
    async idToken(token: string, clientId: string): Promise<jwt.JwtPayload> {
        const decoded = jwt.decode(token, { complete: true });
        if (!decoded) throw new Error('Malformed JWT');

        const key = await this.jwks.getSigningKey(decoded.header.kid);
        const payload = jwt.verify(token, key.getPublicKey(), {
            algorithms: ['RS256'],
            issuer: this.issuer,
            audience: clientId,
        });
        if (typeof payload === 'string' || payload.typ !== 'ID') throw new Error('Not an ID token');
        if (payload.azp !== undefined && payload.azp !== clientId) throw new Error('ID token issued to another client');
        return payload;
    }

    // in the future we might want to add online() verifications via introspection
}
