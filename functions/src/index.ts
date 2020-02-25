/**
 * # Firebase functions
 *
 * @packageDocumentation
 */
// eslint-disable-next-line import/no-unassigned-import
import 'module-alias/register'

import * as admin from 'firebase-admin'
import * as functions from 'firebase-functions'
import { Role } from 'lib/users/auth'
import generate from 'lib/users/passwd'

// Firebase SDK initialization
admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    databaseURL: 'https://copa-calo-devel.firebaseio.com',
    storageBucket: 'copa-calo-devel.appspot.com'
})


/**
 * Generate random password with [[generate|`generate()`]]
 */
export const generatePassword = functions.https.onCall(async (_, context) => {
    await Role.assert(context.auth?.uid, Role.ADMIN)

    const passwd = await generate()
    return passwd
})
