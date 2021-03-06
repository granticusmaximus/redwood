import jwt from 'jsonwebtoken'
import jwksClient from 'jwks-rsa'

// https://auth0.com/docs/api-auth/tutorials/verify-access-token
/**
 * This takes an auth0 jwt and verifies it. It returns something like this:
 * ```js
 * {
 *   iss: 'https://<AUTH0_DOMAIN>/',
 *   sub: 'auth0|xxx',
 *   aud: [ 'api.billable', 'https://<AUTH0_DOMAIN>/userinfo' ],
 *   iat: 1588800141,
 *   exp: 1588886541,
 *   azp: 'QOsYIlHvCLqLzmfDU0Z3upFdu1znlkqK',
 *   scope: 'openid profile email'
 * }
 * ```
 *
 * You can use `sub` as a stable reference to your user, buti f you want the email
 * addres you can set a context object[^0] in rules[^1]:
 *
 * ^0: https://auth0.com/docs/rules/references/context-object
 * ^1: https://manage.auth0.com/#/rules/new
 *
 */
export const verifyAuth0Token = (
  bearerToken: string
): Promise<undefined | object> => {
  return new Promise((resolve, reject) => {
    const { AUTH0_DOMAIN, AUTH0_AUDIENCE } = process.env
    if (!AUTH0_DOMAIN) {
      throw new Error('`AUTH0_DOMAIN` env var is not set.')
    }

    const client = jwksClient({
      jwksUri: `https://${AUTH0_DOMAIN}/.well-known/jwks.json`,
      cache: true,
      rateLimit: true,
    })

    jwt.verify(
      bearerToken,
      (header, callback) => {
        client.getSigningKey(header.kid as string, (error, key) => {
          // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
          // @ts-ignore
          callback(error, key.publicKey || key.rsaPublicKey)
        })
      },
      {
        audience: AUTH0_AUDIENCE,
        issuer: `https://${AUTH0_DOMAIN}/`,
        algorithms: ['RS256'],
      },
      (verifyError, decoded) => {
        if (verifyError) {
          return reject(verifyError)
        }
        resolve(decoded)
      }
    )
  })
}
