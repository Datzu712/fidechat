import { Injectable, ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import jwt from 'jsonwebtoken';
import jwksClient, { type JwksClient, SigningKeyNotFoundError } from 'jwks-rsa';

/** The API's identifier in the access token `aud` claim (RFC 9700 §2.3), added by a Keycloak Audience mapper. */
export const API_AUDIENCE = 'urn:fidechat:api';

/**
 * Verifies Keycloak access tokens locally against the realm JWKS: signature (RS256), issuer,
 * audience (`API_AUDIENCE`) and expiry, plus `typ: Bearer` so an ID token (same key, same issuer)
 * is not accepted as an access token. There is no introspection, so a revoked token stays valid until it expires.
 *
 * An invalid token throws `UnauthorizedException` (401); Keycloak being unreachable while fetching
 * the JWKS throws `ServiceUnavailableException` (503). Callers can let both propagate.
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
        const payload = await this.verify(token, API_AUDIENCE);
        if (payload.typ !== 'Bearer' || typeof payload.sub !== 'string') {
            throw new UnauthorizedException('Not an access token');
        }
        return payload as IReqUser;
    }

    /**
     * Verifies an ID token for `clientId` (OIDC Core §3.1.3.7): signature, issuer, expiry,
     * `aud` = `clientId`, `azp` if present, and `typ: ID`.
     */
    async idToken(token: string, clientId: string): Promise<jwt.JwtPayload> {
        const payload = await this.verify(token, clientId);

        if (payload.typ !== 'ID') throw new UnauthorizedException('Not an ID token');
        if (payload.azp !== undefined && payload.azp !== clientId) {
            throw new UnauthorizedException('ID token issued to another client');
        }
        return payload;
    }

    // in the future we might want to add online() verifications via introspection

    private async verify(token: string, audience: string): Promise<jwt.JwtPayload> {
        const decoded = jwt.decode(token, { complete: true });
        if (!decoded) throw new UnauthorizedException('Malformed JWT');

        let key: jwksClient.SigningKey;
        try {
            key = await this.jwks.getSigningKey(decoded.header.kid);
        } catch (error) {
            if (error instanceof SigningKeyNotFoundError) throw new UnauthorizedException('Unknown signing key');
            throw new ServiceUnavailableException('Keycloak is unavailable');
        }

        try {
            const payload = jwt.verify(token, key.getPublicKey(), {
                algorithms: ['RS256'],
                issuer: this.issuer,
                audience,
            });
            if (typeof payload === 'string') throw new Error('Unexpected JWT payload');
            return payload;
        } catch (error) {
            throw new UnauthorizedException(error instanceof Error ? error.message : 'Invalid token');
        }
    }
}
