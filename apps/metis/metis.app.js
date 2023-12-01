/*
 * Metis Info App - Bangle.js
 */

const storage = require("Storage");
const locale = require('locale');
const solcalc = require('solcalc');
const ENV = process.env;

const COLOUR_BLUE          = 0x001f;   // same as: g.setColor(0, 0, 1)
const COLOUR_CYAN          = 0x07ff;   // same as: g.setColor(0, 1, 1)

const APP_NAME = 'metis';
const headerFontSize = 16;
const infoFontSize = 16;
const borderPixels = 6;
const titleValueCenter = g.getWidth()/2 + 20;
const pages = 3;
var currentPage = 1;
var y = 0;


// get version from an info file (JSON)
function getVersion(file) {
  let j = storage.readJSON(file, 1);
  let v = ( typeof j == 'object' ? j.version : false );
  return v ? ( v ? "v"+v : "Unknown" ) : "N/A";
}

// update solar info once we have a GPS fix
var sunrise = 'TBD';
var sunset = 'TBD';
var solnoon = 'TBD';
function updateSol(fix) {
  if (!('fix' in fix) || fix.fix != 1) return;

  Bangle.setGPSPower(false, APP_NAME);

  var now = new Date();
  var lat = fix.lat;
  var lon = fix.lon;
  sunrise = solcalc.sunriseAsString(now, lat, lon);
  sunset = solcalc.sunsetAsString(now, lat, lon);
  solnoon = solcalc.solarNoonAsString(now, lon, 2);

  if (currentPage == 1) drawPage(currentPage);
}


// draw the header
function drawHeader(title, page) {
  g.setBgColor(g.theme.fg);
  g.clearRect(0, 0, g.getWidth(), headerFontSize);

  g.setFont("Vector", headerFontSize).setColor(g.theme.bg);
  g.setFontAlign(-1, -1);
  g.drawString(title, borderPixels, y);
  g.setFontAlign(1, -1);
  g.drawString(page + '/' + pages, g.getWidth() - borderPixels, y);
  y += headerFontSize + borderPixels;

  g.setBgColor(g.theme.bg);
}

// draw a section title
function drawSection(title) {
  g.setColor(g.theme.dark ? COLOUR_CYAN : COLOUR_BLUE);
  g.drawLine(borderPixels, y, g.getWidth() - borderPixels, y);
  y += 2;

  g.setFont("Vector", infoFontSize - 2);
  g.setFontAlign(0, -1);
  g.drawString(title, g.getWidth()/2, y);
  y += infoFontSize - 2;
}

// draw an info line
function drawLine(title, value) {
  g.setFont("Vector", infoFontSize).setColor(g.theme.fg);
  g.setFontAlign(1, -1);
  g.drawString(title+':', titleValueCenter, y);
  g.setFontAlign(-1, -1);
  g.drawString(value, titleValueCenter + borderPixels, y);
  y += infoFontSize;
}

// draw the selected page
function drawPage(page) {
  g.clear(reset);
  y = 0;

  switch (page) {
    case 1:
      drawHeader('Overview', page);
      drawLine('Steps today', Bangle.getHealthStatus('day').steps);
      drawLine('Heart rate', Math.round(Bangle.getHealthStatus('day').bpm));
      drawSection('Solar Times');
      drawLine('Sunrise', sunrise);
      drawLine('Sunset', sunset);
      drawLine('Solar Noon', solnoon);
      break;
    case 2:
      drawHeader('Hardware', page);
      drawLine('Battery', E.getBattery() + '%');
      drawLine('Charging', Bangle.isCharging() ? "Yes" : "No");
      drawLine('Bluetooth', NRF.getSecurityStatus().connected ? 'Conn' : 'Discon.');
      drawSection('Sensors');
      drawLine('Barometer', Bangle.isBarometerOn() ? "ON" : "Off");
      drawLine('Compass', Bangle.isCompassOn() ? "ON" : "Off");
      drawLine('GPS', Bangle.isGPSOn() ? "ON" : "Off");
      drawLine('HRM', Bangle.isHRMOn() ? "ON" : "Off");
      drawLine('Temp.', locale.temp(parseInt(E.getTemperature())));
      break;
    case 3:
      drawHeader('Software', page);
      drawLine('Firmware', ENV.VERSION);
      drawLine('Boot', getVersion('boot.info'));
      drawSection('Memory usage');
      flashInfo = storage.getStats();
      drawLine('Flash (kB)', Math.round(flashInfo.totalBytes / 1024));
      drawLine('Flash free', Math.round(flashInfo.freeBytes * 100 / flashInfo.totalBytes) + '%');
      memInfo = process.memory(false);
      drawLine('Trash (kB)', Math.round(flashInfo.trashBytes / 1024));
      drawLine('RAM (kB)', Math.round(memInfo.total * memInfo.blocksize / 1024));
      drawLine('RAM free', Math.round(memInfo.free * 100 / memInfo.total) + '%');
      break;
    default:
      drawPage(1);
  }

  currentPage = page;
}


// initialise
drawPage(currentPage);

// get GPS fix for solar infos
Bangle.setGPSPower(true, APP_NAME);
Bangle.on('GPS', updateSol);

// turn pages (left/right swipes)
Bangle.setUI("leftright", action => {
  switch (action) {
    case -1:  // left
      currentPage += 1;
      if (currentPage > pages) currentPage = pages;
      drawPage(currentPage);
      break;
    case 1:   // right
      currentPage -= 1;
      if (currentPage < 1) currentPage = 1;
      drawPage(currentPage);
      break;
    default:
      // ignore taps
  }
});
// exit on button press
setWatch(e => { Bangle.showClock(); }, BTN1);

