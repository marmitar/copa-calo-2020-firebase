/**
 * # User authentication and roles
 *
 * @packageDocumentation
 */
import * as admin from 'firebase-admin'
import * as functions from 'firebase-functions'
import HttpsError = functions.https.HttpsError
import Token = admin.auth.DecodedIdToken

/**
 * Roles utilities
 */
export namespace Role {
    export async function get(token: string | Token, check?: boolean): Promise<string> {
        if (typeof token === 'string') {
            const user = await admin.auth().verifyIdToken(token, check)
            return user.role
        } else {
            return token.role
        }
    }

    export async function assert(token: Token | string | undefined, ...roles: string[]): Promise<string>
    export async function assert(token: Token | string | undefined, check: boolean, ...roles: string[]): Promise<string>
    export async function assert(token: Token | string | undefined, check: boolean | string, ...roles: string[]): Promise<string> {
        let doCheck = undefined
        if (typeof check === 'boolean') {
            doCheck = check
        } else {
            roles.push(check)
        }

        const userRole = token === undefined ? undefined : await get(token, doCheck)
        if (userRole === undefined || !roles.includes(userRole)) {
            const msg = `Usuário não tem permissão para isso. Permissão atual: ${userRole}. Token: ${token}`
            throw new HttpsError('permission-denied', msg)
        }
        return userRole
    }
}

export async function setUser(email: string, claims: Object): Promise<void> {
    const {uid} = await admin.auth().getUserByEmail(email)

    await admin.auth().setCustomUserClaims(uid, claims)
}
