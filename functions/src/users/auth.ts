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

export async function setUserPassword(email: string, password: string): Promise<string> {
    try {
        const {uid} = await admin.auth().getUserByEmail(email)
        await admin.auth().updateUser(uid, { password })
        return uid

    } catch (err) {
        if (err.code === 'auth/user-not-found') {
            const {uid} = await admin.auth().createUser({email, password})
            return uid
        } else {
            throw err
        }
    }
}

export async function setUser(email: string, password?: string, claims?: Object): Promise<void> {
    let uid: string
    if (password) {
        uid = await setUserPassword(email, password)
    } else {
        uid = (await admin.auth().getUserByEmail(email)).uid
    }

    if (claims) {
        await admin.auth().setCustomUserClaims(uid, claims)
    }
}

export async function listUsers(startingWith?: string): Promise<admin.auth.UserRecord[]> {
    const users: admin.auth.UserRecord[] = []

    for (let page: undefined | string | null = undefined; page !== null;) {
        type Users = admin.auth.ListUsersResult
        const batch: Users = await admin.auth().listUsers(1000, page)

        if (startingWith) {
            const newUsers = batch.users.filter(u => u.email?.startsWith(startingWith))
            users.push(...newUsers)
        } else {
            users.push(...batch.users)
        }
        page = batch.pageToken ?? null
    }

    return users
}
