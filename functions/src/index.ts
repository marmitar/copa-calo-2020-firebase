/**
 * # Firebase functions
 *
 * @packageDocumentation
 */
// eslint-disable-next-line import/no-unassigned-import
import 'module-alias/register'

import * as admin from 'firebase-admin'
import * as functions from 'firebase-functions'
import { generatePassword } from 'lib/users/passwd'

// Firebase SDK initialization
admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    databaseURL: 'https://copa-calo-devel.firebaseio.com'
})


/**
 * Generate random password with [[generatePassword|`generatePassword()`]]
 *
 * FIXME: not an open function, do not deploy this
 */
export const generate = functions.https.onRequest(async (_, response) => {
    response.send(await generatePassword())
})
