"use strict";

// Facebook offline threading IDs are a timestamp (milliseconds) followed by
// 22 random bits, represented as a decimal string, matching ws3-fca's helper.
function generateOfflineThreadingID() {
  const timestampBits = Date.now().toString(2);
  const randomBits = Math.floor(Math.random() * 2 ** 22)
    .toString(2)
    .padStart(22, "0")
    .slice(-22);
  return BigInt(`0b${timestampBits}${randomBits}`).toString(10);
}

module.exports = { generateOfflineThreadingID };
