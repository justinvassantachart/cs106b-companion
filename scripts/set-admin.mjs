// Script to set admin custom claim for a user
import admin from 'firebase-admin';
import { readFileSync } from 'fs';

// Load service account
const serviceAccount = 'fill in';

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const uid = 'uid';

console.log(`Setting admin claim for user: ${uid}`);

admin.auth().setCustomUserClaims(uid, { admin: true })
    .then(() => {
        console.log('✅ Admin claim set successfully!');
        console.log('');
        console.log('Next steps:');
        console.log('1. Sign out of the app');
        console.log('2. Sign back in');
        console.log('3. The "Admin Portal" button should now appear in the sidebar');
        process.exit(0);
    })
    .catch((error) => {
        console.error('Error setting admin claim:', error);
        process.exit(1);
    });
