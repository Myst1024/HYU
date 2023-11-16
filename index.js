require("dotenv").config();
const { initializeApp, cert } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const serviceAccount = require("./firebaseAccountKey.json");
// For testing only
const readline = require("node:readline");
const { stdin: input, stdout: output } = require("node:process");

const rl = readline.createInterface({ input, output });
// For testing only

initializeApp({
  credential: cert(serviceAccount),
});

const db = getFirestore();

const userLocal = process.env.userLocal;
const userRemote = process.env.userRemote;

const maxTimestampDifference = 3 * 60 * 60 * 1000;

const withinMaxDifference = (first, second) => {
  return Math.abs(first - second) < maxTimestampDifference;
};

let currentData;
let timeLocal;
let timeRemote;

const watchObserver = async () => {
  const doc = await db.collection("hyu").doc("users");

  const observer = doc.onSnapshot(
    (docSnapshot) => {
      currentData = docSnapshot.data();
      timeLocal = currentData[userLocal];
      timeRemote = currentData[userRemote];
      console.log(`Received snapshot: ${[timeLocal, timeRemote]}`);

      if (withinMaxDifference(timeRemote, timeLocal)) {
        //!TODO check if time is within 3hrs of current before turning on
        console.log("turning on full");
        //!TODO after any turn on action, set a 3 hour timeout to trigger a turn off
      } else {
        if (withinMaxDifference(Date.now(), timeLocal)) {
          console.log("turning on half");
        } else {
          console.log("turning off");
        }
      }
    },
    (err) => {
      console.log(`Encountered error: ${err}`);
    }
  );
};

const setLocalUserTime = async (time) => {
  await db
    .collection("hyu")
    .doc("users")
    .update({ [userLocal]: time });
};

// For testing only
rl.prompt();
rl.on("line", (input) => {
  console.log(`Pressed!`);
  if (withinMaxDifference(Date.now(), timeLocal)) {
    const yesterday = Date.now() - 24 * 60 * 60 * 1000;
    setLocalUserTime(yesterday);
  } else {
    setLocalUserTime(Date.now());
  }
});
// For testing only

watchObserver();
