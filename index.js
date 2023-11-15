require('dotenv').config()

const { initializeApp, applicationDefault, cert } = require('firebase-admin/app');
const { getFirestore, Timestamp, FieldValue, Filter } = require('firebase-admin/firestore');
const serviceAccount = require('./firebaseAccountKey.json');

const user = process.env.user;

initializeApp({
    credential: cert(serviceAccount)
});

const db = getFirestore();


const setTime = async () => {
    await db.collection('hyu').doc('users').set({ [user]: Date.now() })

    const res = await db.collection('hyu').doc('users').get();
    console.log(res.data())

}

setTime();