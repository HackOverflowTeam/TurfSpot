const admin = require('firebase-admin');

let firebaseApp = null;

const initializeFirebase = () => {
  try {
    if (!firebaseApp) {
      // Parse the private key from environment variable
      const privateKey = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');

      firebaseApp = admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: privateKey
        })
      });

      console.log('✅ Firebase Admin initialized successfully');
    }
    return firebaseApp;
  } catch (error) {
    console.error('❌ Firebase initialization error:', error.message);
    throw error;
  }
};

const getFirebaseAdmin = () => {
  if (!firebaseApp) {
    throw new Error('Firebase Admin not initialized');
  }
  return admin;
};

module.exports = {
  initializeFirebase,
  getFirebaseAdmin
};
