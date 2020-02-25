/**
 * # User authentication and roles
 *
 * @packageDocumentation
 */
import * as admin from 'firebase-admin'
import * as functions from 'firebase-functions'
import HttpsError = functions.https.HttpsError

/**
 * # User roles
 */
export enum Role {
    ADMIN = 'admin',
    NONE = 'none'
}

/**
 * Roles utilities
 */
export namespace Role {
    /**
     * Get user role
     *
     * @param uid  User id
     */
    export async function get(uid: string): Promise<Role> {
        const doc = await admin.firestore()
            .collection('users')
            .doc(uid)
            .get()

        return doc.get('role') ?? Role.NONE
    }

    /**
     * Test user for Roles
     *
     * @param uid  User id
     * @param roles Possible roles
     */
    export async function assert(uid: string | undefined, ...roles: Role[]): Promise<Role> {
        let userRole = Role.NONE
        if (uid === undefined || !roles.includes(userRole = await get(uid))) {
            const msg = `Usuário não tem permissão para isso. Permissão atual: ${userRole}.`
            throw new HttpsError('permission-denied', msg)
        }
        return userRole
    }
}
