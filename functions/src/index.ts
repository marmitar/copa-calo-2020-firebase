/**
 * # Firebase functions
 *
 * @packageDocumentation
 */
// eslint-disable-next-line import/no-unassigned-import
import 'module-alias/register'

import * as admin from 'firebase-admin'
import * as functions from 'firebase-functions'
import { Role, listUsers, setUser, resetPassword } from 'lib/users/auth'
import generate from 'lib/users/passwd'

// Firebase SDK initialization
admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    databaseURL: 'https://copa-calo-devel.firebaseio.com',
    storageBucket: 'copa-calo-devel.appspot.com'
})

function adminCall(...fn: Parameters<typeof functions.https.onCall>): ReturnType<typeof functions.https.onCall> {
    return functions.https.onCall(async (data, ctx) => {
        await Role.assert(ctx.instanceIdToken || ctx.auth?.token, true, 'admin')

        return fn[0](data, ctx)
    })
}


/**
 * Generate random password with [[generate|`generate()`]]
 */
export const generatePassword = adminCall(generate)

export const listAllUsers = adminCall(async start => {
    const users = await listUsers(start)
    return users.map(user => Object.assign(user.customClaims ?? {}, {email: user.email!}))
})
export const setUserRole = adminCall(data => setUser(data.email, data.claims))
export const setUserPassword = adminCall(data => resetPassword(data.email, data.password))
