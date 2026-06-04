/*
 * Decide by Coin toss - Bangle.js
 */

const COLOUR_BLACK         = 0x0000;   // same as: g.setColor(0, 0, 0)
const COLOUR_GREY          = 0x8410;   // same as: g.setColor(0.5, 0.5, 0.5)
const COLOUR_ROYALBLUE     = 0x041f;   // same as: g.setColor(0, 0.5, 1)


const COIN_RADIUS = 62;
const ROTATION_DIST = 6;
const FLIPS = 4;


const headsImg = require("heatshrink").decompress(atob("pljwkBiIAPilBCSAgOH5EFFTEVNBokVR6FRNjYAJWaNAbqacPiAkTTZ5vTAAcEN8LBPJS4ABqAlKEjDnLiolagrgfcx1QErZyHJThMIEsokdOQzhbEpJwegEEEolAEryYFEj4lmqKWiXwol/Etq+DEstQEsgkhEv4ALgpL/EulAS8kQEv4AGgIl/ABVRJdEVEsEAEoUREv5yLEsq+hOQYlioIlBiiY/ORdAJkiYiEoSYiOQYkhgolCOUMEEsiXCOUFREYZMgEgpMfEo5MdSohMgEpBMcXowACqCXiJjhwIAAVVEshzZEskES5RLnS7FBEscFEhZxYEpkUOLAlLiAl9gjikJZgkYqBwjqEBEr1QAolRODgVDE4SVLB4YANNBZwIEqAkSSyQlTEiBwUgoljiMVS50FEiaYQEq0RoBwhYCAlYiKaLqIlYiolKEjDoMErToKErYmIXjLoLErwmGcTJzLEjwmCdAYlgJoglhEwUFEsQmBXj4AFoIRQA=="));
const tailsImg = require("heatshrink").decompress(atob("rMxwkBiIAfignBqIkgAAtAKokEFUZVCAAqAhiMQWBAshFZIABFb9QFZUFFbwqKLMArNggrcoBPHiCNEFjjbEgJiJBQoAViggDoI3KqKweFY0RirfeJgZ4IBgayaQgjqMWTT/DDxKFdaIhmMQrQrDLBK/MFitBQukVb0IsJoAMHIYi8QCgcFbxZYECoZkSCZhYGKwgAEZhL9QLAy4DAAyINFga/MK5YbLFgtQMpwrMgFRcZ6+LbZDiWLBohDqEFdQi0RABDWDEgIgDgtBdgwsZQgiwENBI+DQjArKNIgNJFaCEFaRAsYUIjiGFhFQFixSEGIoAIFYgsSPwoFDoKZNAANRFaaEPcI4RLFZIGEeZ4sQNoxIDDJgsTCQ4bCggYMFgpsLig+IDYRxNFgxaJoDEUFhkAoI7WFikAqlEAAILHFayhGABorXfQwrmiNFFR0FFTK0KXQwrbQ5sFoIrdFpataFpsFqBVKiAA=="));

const bgColour = COLOUR_ROYALBLUE;

const yStepsHalf = (COIN_RADIUS * 2 / ROTATION_DIST + 1) * FLIPS / 2;
const x1 = g.getWidth() / 2 - COIN_RADIUS;
const x2 = g.getWidth() / 2 + COIN_RADIUS;

var y;
var yStep;
var rotation;
var flipCount;

var updateCoinTimeout;


// draw the coin
function updateCoin() {
  if (updateCoinTimeout) clearTimeout(updateCoinTimeout);

  g.setBgColor(bgColour).clearRect(x1, y - rotation, x2, y + rotation - 1);

  // rotate it
  if (rotation < COIN_RADIUS) {
    rotation += ROTATION_DIST;
  } else {
    rotation = COIN_RADIUS * -1;
    flipCount += 1;
  }

  // ballistic
  yStep += 1;
  if (yStep < yStepsHalf)
    y -= (yStepsHalf - yStep) * 0.1;
  else
    y += (yStep - yStepsHalf) * 0.09;

  // draw coin shape
  g.setColor(COLOUR_BLACK).drawEllipse(x1, y - rotation, x2, y + rotation);
  g.setColor(COLOUR_GREY).fillEllipse(x1 + 1, y - rotation, x2, y + rotation - 1);
  g.setColor(COLOUR_BLACK).drawEllipse(x1 + 1, y - rotation, x2, y + rotation - 1);

  if (flipCount < FLIPS) {
    // more turns
    updateCoinTimeout = setTimeout(updateCoin, 30);
  } else {
    // done -> reveal the decision
    updateCoinTimeout = undefined;
    let msg = '';
    if (Math.random() < 0.5) {
      g.drawImage(headsImg, g.getWidth() / 2 - 38, y - 47);
      msg = 'Heads!';
    } else {
      g.drawImage(tailsImg, g.getWidth() / 2 - 45, y - 25);
      msg = 'Tails!';
    }
    g.setFontAlign(0, -1).setFont("Vector", 25);
    g.drawString(msg, g.getWidth()/2, 10);
  }
}

// start a coin toss
function toss() {
  if (updateCoinTimeout) return;

  g.reset().setBgColor(bgColour).clear();

  y = g.getHeight() - COIN_RADIUS - 7;
  yStep = 0;
  rotation = COIN_RADIUS * -1;
  flipCount = 0;

  updateCoin();
}


// initialise app
g.reset().setBgColor(bgColour).clear();

g.setFontAlign(0, 0).setFont("Vector", 25);
g.drawString('Tap to Toss', g.getWidth()/2, g.getHeight()/2);


// handle touch/taps
Bangle.setUI('updown', action => {
  if (action === undefined)
    toss();
});
Bangle.on('tap', data => { toss(); });

// exit on button press
setWatch(e => { Bangle.showClock(); }, BTN1);

