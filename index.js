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

let lightOffTimeoutID = 0;

const clearLightOffTimeout = () => {
  if (lightOffTimeoutID) {
    clearTimeout(lightOffTimeoutID);
    lightOffTimeoutID = 0;
  }
};

const lightFull = () => {
  console.log("turning on full 🌕");
  clearLightOffTimeout();
  lightOffTimeoutID = setTimeout(lightOff, maxTimestampDifference);
};

const lightHalf = () => {
  console.log("turning on half  🌗");
  clearLightOffTimeout();
  lightOffTimeoutID = setTimeout(lightOff, maxTimestampDifference);
};

function lightOff() {
  clearLightOffTimeout();
  console.log("turning off 🌑");
}

let currentData;
let timeLocal;
let timeRemote;

const watchUsersDoc = async () => {
  const doc = await db.collection("hyu").doc("users");

  doc.onSnapshot(
    (docSnapshot) => {
      currentData = docSnapshot.data();
      timeLocal = currentData[userLocal];
      timeRemote = currentData[userRemote];
      console.log(`Received snapshot: ${[timeLocal, timeRemote]}`);

      if (withinMaxDifference(Date.now(), timeLocal)) {
        if (withinMaxDifference(timeRemote, timeLocal)) {
          lightFull();
        } else {
          lightHalf();
        }
      } else {
        lightOff();
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

watchUsersDoc();
