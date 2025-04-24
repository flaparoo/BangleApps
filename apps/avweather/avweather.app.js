/*
 * Aviation Weather (AvWeather) - Bangle.js
 *
 */

require("Font8x12").add(Graphics);

const COLOUR_BLACK         = 0x0000;   // same as: g.setColor(0, 0, 0)
const COLOUR_WHITE         = 0xffff;   // same as: g.setColor(1, 1, 1)
const COLOUR_RED           = 0xf800;   // same as: g.setColor(1, 0, 0)
const COLOUR_LIGHT_BLUE    = 0x841f;   // same as: g.setColor(0.5, 0.5, 1)
const COLOUR_DARK_BLUE     = 0x0010;   // same as: g.setColor(0, 0, 0.5)

const APP_NAME = 'avweather';

const timeColour = ( g.theme.dark ? COLOUR_DARK_BLUE : COLOUR_LIGHT_BLUE );
const headerBgColour = ( g.theme.dark ? COLOUR_WHITE : COLOUR_BLACK );

const avwx = require('avwx');


// read in the settings
var settings = Object.assign({
  font: 2,  // Large
}, require('Storage').readJSON(APP_NAME+'.json', true) || {});


// globals
var headerTimeout;

var METARrequest;
var METAR = '';
var TAFrequest;
var TAF = '';
var updateInProgress = true;
var linesCount = 0;
var scrollLines = 0;


// set timeout for per-minute updates
function queueHeaderUpdate() {
  if (headerTimeout) clearTimeout(headerTimeout);
  headerTimeout = setTimeout(function() {
    headerTimeout = undefined;
    drawHeader();
  }, 60000 - (Date.now() % 60000));
}

// draw header info
function drawHeader() {
  g.setBgColor(headerBgColour);
  g.clearRect(0, 0, g.getWidth(), 17);

  let now = new Date();
  let nowUTC = new Date(now + (now.getTimezoneOffset() * 1000 * 60));
  let dateTimeStr = nowUTC.getDate().toString();
  if (dateTimeStr.length == 1) dateTimeStr = '0' + dateTimeStr;
  let hours = nowUTC.getHours().toString();
  if (hours.length == 1) hours = '0' + hours;
  dateTimeStr += hours;
  let minutes = nowUTC.getMinutes().toString();
  if (minutes.length == 1) minutes = '0' + minutes;
  dateTimeStr += minutes;

  g.setFontAlign(-1, -1).setFont("Vector", 16).setColor(timeColour);
  g.drawString(dateTimeStr + "Z", 0, 0, true);

  g.clearRect(g.getWidth() / 2, 0, g.getWidth(), 17);
  g.setFontAlign(1, -1).setFont("8x12").setColor(COLOUR_RED);
  g.drawString( updateInProgress ? 'Updating...' : '' , g.getWidth(), 2);

  queueHeaderUpdate();
}


// draw the METAR/TAF info
function draw() {
  g.clear(true);

  drawHeader();

  g.setBgColor(g.theme.bg);
  g.setFontAlign(-1, -1).setColor(g.theme.fg);
  switch (settings.font) {
    case 0:   // Small
      g.setFont("8x12");
      linesCount = -13;
      break;
    case 1:   // Medium
      g.setFont("Vector", 16);
      linesCount = -9;
      break;
    default:  // Large
      g.setFont("Vector", 22);
      linesCount = -7;
  }
  let lines = g.wrapString(METAR, g.getWidth());
  lines.push('');
  lines = lines.concat(g.wrapString(TAF, g.getWidth()));
  linesCount += lines.length;
  lines.splice(0, scrollLines);
  g.drawString(lines.join("\n"), 0, 18, true);
}

// update the METAR info (incl. schedule next update)
function updateAVWX() {
  METAR = '\nGetting GPS fix';
  TAF = '';
  linesCount = 0; scrollLines = 0;
  draw();

  Bangle.setGPSPower(true, APP_NAME);
  Bangle.on('GPS', fix => {
    if (METARrequest || TAFrequest) { return; }
    if ('fix' in fix && fix.fix != 0 && fix.satellites >= 4) {
      Bangle.setGPSPower(false, APP_NAME);
      let lat = fix.lat;
      let lon = fix.lon;

      METAR = 'Requesting METAR';
      TAF = 'Requesting TAF';
      linesCount = 0; scrollLines = 0;
      draw();

      // get METAR
      METARrequest = avwx.request('metar/'+lat+','+lon, 'filter=sanitized&onfail=nearest', data => {
        let METARjson = JSON.parse(data.resp);
        if ('sanitized' in METARjson) {
          METAR = METARjson.sanitized;
        } else {
          METAR = 'No "sanitized" METAR data found!';
        }
        linesCount = 0; scrollLines = 0;
        METARrequest = undefined;
        if (! TAFrequest) { updateInProgress = false; }
        draw();
      }, error => {
        console.log(error);
        METAR = 'METAR ERR: ' + error;
        linesCount = 0; scrollLines = 0;
        METARrequest = undefined;
        if (! TAFrequest) { updateInProgress = false; }
        draw();
      });

      // get TAF
      TAFrequest = avwx.request('taf/'+lat+','+lon, 'filter=raw&onfail=nearest', data => {
        let TAFjson = JSON.parse(data.resp);
        if ('raw' in TAFjson) {
          TAF = TAFjson.raw;
        } else {
          TAF = 'No "raw" TAF data found!';
        }
        linesCount = 0; scrollLines = 0;
        TAFrequest = undefined;
        if (! METARrequest) { updateInProgress = false; }
        draw();
      }, error => {
        console.log(error);
        TAF = 'TAF ERR: ' + error;
        linesCount = 0; scrollLines = 0;
        TAFrequest = undefined;
        if (! METARrequest) { updateInProgress = false; }
        draw();
      });
    }
  });
}


/*
 * initialise app
 */
updateAVWX();
draw();


// scroll (up/down swipes)
Bangle.setUI("updown", action => {
  switch (action) {
    case -1:  // top tap
      if (scrollLines < linesCount) {
        scrollLines += 2;
        if (scrollLines > linesCount) { scrollLines = linesCount; }
      }
      break;
    case 1:   // bottom tap
      if (scrollLines > 0) {
        scrollLines -= 2;
        if (scrollLines < 0) { scrollLines = 0; }
      }
      break;
    default:  // update on other taps
      updateInProgress = true;
      updateAVWX();
  }
  draw();
});
// exit on button press
setWatch(e => { Bangle.showClock(); }, BTN1);


// for debugging:
//METAR = 'YAAA 150300Z 17019KT 9999 SCT009 SCT022 BKN100 21/18 Q1010 RMK RF000/0000';
//TAF = 'YAAA 150213Z 1503/1606 17018KT 9999 FEW010 BKN022 FM150800 15008KT 9999 FEW010 BKN020 FM151200 19006KT 9999 SCT010 BKN016 FM152300 13008KT 9999 BKN020 FM160200 13016KT 9999 BKN025 RMK T 22 22 21 20 Q 1010 1009 1010 1010 TAF3';
//METARrequest = true;
//setTimeout(function() { METARrequest = undefined; drawHeader(); }, 3*1000);
//settings.font = 1;
