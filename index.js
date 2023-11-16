require('dotenv').config()

const { initializeApp, applicationDefault, cert } = require('firebase-admin/app');
const { getFirestore, Timestamp, FieldValue, Filter } = require('firebase-admin/firestore');
const serviceAccount = require('./firebaseAccountKey.json');

const userLocal = process.env.userLocal;
const userRemote = process.env.userRemote

const maxTimestampDifference = 3 * 60 * 60 * 1000;

initializeApp({
    credential: cert(serviceAccount)
});

const db = getFirestore();

let currentData;
let timeLocal;
let timeRemote;

const watchObserver = async () => {

    const doc = await db.collection('hyu').doc('users');

    const observer = doc.onSnapshot(docSnapshot => {
        currentData = docSnapshot.data();
        timeLocal = currentData[userLocal];
        timeRemote = currentData[userRemote];
        console.log(`Received snapshot: ${[timeLocal, timeRemote]}`);

        if (Math.abs(timeLocal - timeRemote) < maxTimestampDifference) {
            console.log('turning on full')
        } else {
            if (Math.abs(timeLocal - Date.now()) < maxTimestampDifference) {
                console.log('turning on half');
            } else {
                console.log('turning off')
            }
        }

    }, err => {
        console.log(`Encountered error: ${err}`);
    });
}


//!TODO: if user time within timedifference, set to 1 day prior
const setTime = async () => {
    await db.collection('hyu').doc('users').update({ [userLocal]: Date.now() })

    const res = await db.collection('hyu').doc('users').get();
    const { gunnar, shay } = res.data();
    console.log(Math.abs(gunnar - shay));

}
watchObserver();
// setTime();