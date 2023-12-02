const { initializeApp, cert } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const { userLocal, userRemote } = require("./users.json");
const serviceAccount = require("./firebaseAccountKey.json");
const Gpio = require("onoff").Gpio;

// For testing only
// const readline = require("node:readline");
// const { stdin: input, stdout: output } = require("node:process");

// const rl = readline.createInterface({ input, output });
// For testing only

initializeApp({
  credential: cert(serviceAccount),
});

const db = getFirestore();

const maxTimestampDifference = 3 * 60 * 60 * 1000;

/** Buttons & LEDs */
const pushButton = new Gpio(258, "in", "falling", {
  debounceTimeout: 50,
  activeLow: true,
  reconfigureDirection: false,
});
const ledBlue = new Gpio(260, "out");
const ledGreen = new Gpio(259, "out");

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
  ledBlue.writeSync(0);
  ledGreen.writeSync(1);
  clearLightOffTimeout();
  lightOffTimeoutID = setTimeout(lightOff, maxTimestampDifference);
};

const lightHalf = () => {
  console.log("turning on half  🌗");
  ledGreen.writeSync(0);
  ledBlue.writeSync(1);
  clearLightOffTimeout();
  lightOffTimeoutID = setTimeout(lightOff, maxTimestampDifference);
};

const lightOff = () => {
  console.log("turning off 🌑");
  ledGreen.writeSync(0);
  ledBlue.writeSync(0);
  clearLightOffTimeout();
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

const setLocalUserTime = async (time) => {
  await db
    .collection("hyu")
    .doc("users")
    .update({ [userLocal]: time });
};

// For testing only
// rl.prompt();
// rl.on("line", (input) => {
//   console.log(`Pressed!`);
//   if (withinMaxDifference(Date.now(), timeLocal)) {
//     const yesterday = Date.now() - 24 * 60 * 60 * 1000;
//     setLocalUserTime(yesterday);
//   } else {
//     setLocalUserTime(Date.now());
//   }
// });
// For testing only

setTimeout(() => {
  if (Gpio.accessible) {
    pushButton.watch(function (err, value) {
      if (err) {
        console.error("There was an error", err);
        return;
      }
      console.log(`Pressed!`, value);
      if (withinMaxDifference(Date.now(), timeLocal)) {
        const yesterday = Date.now() - 24 * 60 * 60 * 1000;
        setLocalUserTime(yesterday);
      } else {
        setLocalUserTime(Date.now());
      }
    });
  } else {
    console.log("gpio not acessible");
  }
}, 1000);
watchUsersDoc();

process.on("beforeExit", lightOff);
process.on("SIGINT", () => {
  lightOff();
  pushButton.unexport();
  ledBlue.unexport();
  ledGreen.unexport();
  process.exit();
});
