/*
 * Avi8or Clock - Bangle.js
 *
 */

const COLOUR_DARK_GREY = 0x4208; // same as: g.setColor(0.25, 0.25, 0.25)
const COLOUR_GREY = 0x8410; // same as: g.setColor(0.5, 0.5, 0.5)
const COLOUR_LIGHT_GREY = 0xc618; // same as: g.setColor(0.75, 0.75, 0.75)
const COLOUR_BLUE = 0x001f; // same as: g.setColor(0, 0, 1)
const COLOUR_ORANGE = 0xfc00; // same as: g.setColor(1, 0.5, 0)
const COLOUR_LIGHT_CYAN = 0x87ff; // same as: g.setColor(0.5, 1, 1)
const COLOUR_DARK_CYAN = 0x0410; // same as: g.setColor(0, 0.5, 0.5)
const COLOUR_PINK = 0xf810; // same as: g.setColor(1, 0, 0.5)
const COLOUR_YELLOW = 0xffe0; // same as: g.setColor(1, 1, 0)

const APP_NAME = 'avi8orclk';

const horizontalCenter = g.getWidth() / 2;
const mainTimeHeight = 38;
const secondaryFontHeight = 27;
const tertiaryFontHeight = 20;
const dateColour = (g.theme.dark ? COLOUR_ORANGE : COLOUR_BLUE);
const UTCColour = (g.theme.dark ? COLOUR_LIGHT_CYAN : COLOUR_DARK_CYAN);
const separatorColour = (g.theme.dark ? COLOUR_LIGHT_GREY : COLOUR_DARK_GREY);
const sunColour = ( g.theme.dark ? COLOUR_YELLOW : COLOUR_PINK );


// read in the settings
var settings = Object.assign({
  showSeconds: false,
  useMyLocation: false,
  gpsUpdateInterval: 60,  // minutes
}, require('Storage').readJSON(APP_NAME + '.json', true) || {});


// globals
var drawTimeout;
var secondsInterval;
var sunTimesTimeout;
var sunrise, sunset;



// date object to time string in format HH:MM[:SS]
// (with a leading 0 for hours if required, unlike the "locale" time() function)
function timeStr(date, seconds) {
  let timeStr = date.getHours().toString();
  if (timeStr.length == 1) timeStr = '0' + timeStr;
  let minutes = date.getMinutes().toString();
  if (minutes.length == 1) minutes = '0' + minutes;
  timeStr += ':' + minutes;
  if (seconds) {
    let seconds = date.getSeconds().toString();
    if (seconds.length == 1) seconds = '0' + seconds;
    timeStr += ':' + seconds;
  }
  return timeStr;
}


// update sunrise/sunset times
function updateSunTimes() {

  if (settings.useMyLocation) {
    // use "My Location"
    var mylocation = require("Storage").readJSON("mylocation.json",1)||{};
    if ('lat' in mylocation && 'lon' in mylocation) {
      let now = new Date(Date.now());
console.log(APP_NAME+": using My Location "+mylocation.lat+" "+mylocation.lon+" at "+now.toString());         //DEBUG
      let sunTimes = require("suncalc").getTimes(now, mylocation.lat, mylocation.lon);
      sunrise = require("locale").time(sunTimes.sunrise, 1).trim();
      sunset  = require("locale").time(sunTimes.sunset,  1);

      // update "My Location" based sun-times daily:
      if (sunTimesTimeout) clearTimeout(sunTimesTimeout);
      sunTimesTimeout = setTimeout(updateSunTimes, 1440 * 60000);

    } else {
      // no location -> ignore "My Location" and use GPS
      settings.useMyLocation = false;
    }
  }

  if (! settings.useMyLocation) {
    // get GPS fix
    if (! sunrise && ! sunset)
      sunrise = "GPS"; sunset = "pending";
    Bangle.setGPSPower(true, APP_NAME);
    Bangle.on('GPS', fix => {
      if ('fix' in fix && fix.fix != 0 && fix.satellites >= 4) {
        Bangle.setGPSPower(false, APP_NAME);

        let now = new Date(Date.now());
console.log(APP_NAME+": GPS fix "+fix.lat+" "+fix.lon+" at "+now.toString());                                 //DEBUG
        let sunTimes = require("suncalc").getTimes(now, fix.lat, fix.lon);
        sunrise = require("locale").time(sunTimes.sunrise, 1).trim();
        sunset  = require("locale").time(sunTimes.sunset,  1);
        draw();

        if (sunTimesTimeout) clearTimeout(sunTimesTimeout);
        sunTimesTimeout = setTimeout(updateSunTimes, settings.gpsUpdateInterval * 60000);
      }
    });
  }

  if (! sunrise && ! sunset)
    sunrise = "N/A"; sunset = "N/A";
}


// draw only the seconds part of the main clock
function drawSeconds() {
  let now = new Date();
  let seconds = now.getSeconds().toString();
  if (seconds.length == 1) seconds = '0' + seconds;
  let y = Bangle.appRect.y + secondaryFontHeight + tertiaryFontHeight + 4 + mainTimeHeight;
  g.setBgColor(g.theme.bg);
  g.setFontAlign(-1, 1).setFont("Vector", secondaryFontHeight).setColor(COLOUR_GREY);
  g.drawString(seconds, horizontalCenter + 54, y, true);
}

// sync seconds update
function syncSecondsUpdate() {
  drawSeconds();
  setTimeout(function() {
    drawSeconds();
    secondsInterval = setInterval(drawSeconds, 1000);
  }, 1000 - (Date.now() % 1000));
}


// set timeout for per-minute updates
function queueDraw() {
  if (drawTimeout) clearTimeout(drawTimeout);
  drawTimeout = setTimeout(function() {
    drawTimeout = undefined;
    draw();
  }, 60000 - (Date.now() % 60000));
}

// draw top part of clock (main time, date and UTC)
function draw() {
  let now = new Date();
  let nowUTC = new Date(now + (now.getTimezoneOffset() * 1000 * 60));

  let y = Bangle.appRect.y;

  g.setBgColor(g.theme.bg);
  g.clearRect(0, y, g.getWidth(), g.getHeight());

  // UTC
  let utcDate = nowUTC.getDate().toString();
  if (utcDate.length == 1) utcDate = '0' + utcDate;
  g.setFontAlign(0, -1).setFont("Vector", secondaryFontHeight).setColor(UTCColour);
  g.drawString(utcDate + " " + timeStr(nowUTC, false) + "Z", horizontalCenter, y, false);
  y += secondaryFontHeight;

  // UTC offset
  g.setFontAlign(0, -1).setFont("Vector", tertiaryFontHeight).setColor(COLOUR_GREY);
  let TZoffset = now.getTimezoneOffset();
  let TZplusminus = '-';
  if (TZoffset < 0) {
    TZplusminus = '+';
    TZoffset *= -1;
  }
  let TZoffsetHH = Math.floor(TZoffset / 60).toString();
  if (TZoffsetHH.length == 1) TZoffsetHH = '0' + TZoffsetHH;
  let TZoffsetMM = (TZoffset % 60).toString();
  if (TZoffsetMM.length == 1) TZoffsetMM = '0' + TZoffsetMM;
  g.drawString("UTC" + TZplusminus + TZoffsetHH + ":" + TZoffsetMM, horizontalCenter, y, false);
  y += tertiaryFontHeight;

  // draw static separator line
  g.setColor(separatorColour);
  g.drawLine(0, y, g.getWidth(), y);
  y += 4;

  // main time
  y += 2;
  g.setFontAlign(0, -1).setFont("Vector", mainTimeHeight).setColor(g.theme.fg);
  g.drawString(timeStr(now, false), horizontalCenter, y, false);
  if (settings.showSeconds)
    drawSeconds();
  y += mainTimeHeight;

  // draw static separator line
  g.setColor(separatorColour);
  g.drawLine(0, y, g.getWidth(), y);
  y += 4;

  // weekday and day of the month
  g.setFontAlign(0, -1).setFont("Vector", secondaryFontHeight).setColor(dateColour);
  g.drawString(require("locale").dow(now, 1).toUpperCase() + ' ' + now.getDate(), horizontalCenter, y, false);
  y += secondaryFontHeight;

  // Sunrise + Sunset
  y += 4;
  g.setColor(sunColour);
  g.drawImage(atob("FBSBAAAAAAAAAAAABgAA8AAfgAAAAAAAAGAABgAYYYDAMAQCAB+AA/gAP8A//8H/+AAAAAAA"), 0, y - 22);
  g.setFontAlign(-1, -1).setFont("Vector", secondaryFontHeight);
  g.drawString(sunrise, 0, y, false);
  g.drawImage(atob("FBSBAAAAAAAAAAAAH4AA8AAGAAAAAAAAAGAABgAYYYDAMAQCAB+AA/gAP8A//8H/+AAAAAAA"), g.getWidth() - 20, y - 22);
  g.setFontAlign(1, -1);
  g.drawString(sunset, g.getWidth(), y, false);

  queueDraw();
}



// calculate location-based sunrise/sunset
updateSunTimes();

// initialise
g.clear(true);

Bangle.on('tap', data => {
  switch (data.dir) {
    case 'front':
      // toggle seconds display on double tap on front/watch-face
      // (if watch is un-locked)
      if (data.double && !Bangle.isLocked()) {
        if (settings.showSeconds) {
          clearInterval(secondsInterval);
          let y = Bangle.appRect.y + secondaryFontHeight + tertiaryFontHeight + 4 + mainTimeHeight;
          g.clearRect(horizontalCenter + 54, y - secondaryFontHeight, g.getWidth(), y);
          settings.showSeconds = false;
        } else {
          settings.showSeconds = true;
          syncSecondsUpdate();
        }
      }
      break;
    default:
      // ignore other taps
  }
});

Bangle.setUI("clock");

// load widgets
Bangle.loadWidgets();
Bangle.drawWidgets();

// draw times
draw();
if (settings.showSeconds)
  syncSecondsUpdate();

