require('dotenv').config()

const { initializeApp, applicationDefault, cert } = require('firebase-admin/app');
const { getFirestore, Timestamp, FieldValue, Filter } = require('firebase-admin/firestore');
const serviceAccount = require('./firebaseAccountKey.json');

const user = process.env.user;

const maxTimestampDifference = 3 * 60 * 60 * 1000;

initializeApp({
    credential: cert(serviceAccount)
});

const db = getFirestore();

//!TODO: if user time within timedifference, set to 1 day prior
const setTime = async () => {
    await db.collection('hyu').doc('users').update({ [user]: Date.now() })

    const res = await db.collection('hyu').doc('users').get();
    const { gunnar, shay } = res.data();
    console.log(Math.abs(gunnar - shay));

}

setTime();