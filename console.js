const { initializeApp, cert } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const { userLocal, userRemote } = require("./users.json");
const serviceAccount = require("./firebaseAccountKey.json");

initializeApp({
  credential: cert(serviceAccount),
});

const db = getFirestore();

const maxTimestampDifference = 3 * 60 * 60 * 1000;

const withinMaxDifference = (first, second) => {
  return Math.abs(first - second) < maxTimestampDifference;
};

const lightFull = () => {
  process.stdout.write('\x1Bc')
  console.log("\x1b[42m                    \x1b[0m");
  console.log("\x1b[42m turning on full 🌕 \x1b[0m");
  console.log("\x1b[42m                    \x1b[0m");
};

const lightHalf = () => {
  process.stdout.write('\x1Bc')
  console.log("\x1b[44m                     \x1b[0m");
  console.log("\x1b[44m turning on half  🌗 \x1b[0m");
  console.log("\x1b[44m                     \x1b[0m");
};

const lightOff = () => {
  process.stdout.write('\x1Bc')
  console.log(" ")
  console.log("turning off 🌑");
};

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

watchUsersDoc();
