/*
 * Fuzzy Clock
 */

const BORDER_WIDTH = 24;

const centerX = g.getWidth() / 2;
const centerY = g.getHeight() / 2;

var drawInterval;
var prevMetaTime = '';


// read in the settings
var settings = Object.assign({
  font: 'Handlee',
}, require('Storage').readJSON('fuzzyclk.json', true) || {});


if (settings.font == 'Gochi') {
  // Gochi Hand from Google fonts
  Graphics.prototype.setFontGochiHand = function() {
    // Actual height 30 (29 - 0)
    return this.setFontCustom(
      E.toString(require('heatshrink').decompress(atob('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'))),
      32,
    atob("BwgMDg0TDggJCQoPCQkJBxEMDxAOEA8QEA8JCQoOCg8eEg8QFBMPExEHEBELFRQSERQQDgwRERoQDhMKCQoNDw0REAoSDwkREAcJDQcVDhAPEgsLDA4NFxAPDQsICw4A"),
      30|65536
    );
  };

} else if (settings.font == 'Delicious') {
  // Delicious Handrawn from Google fonts
  Graphics.prototype.setFontDeliciousHandrawn = function() {
    // Actual height 30 (29 - 0)
    return this.setFontCustom(
      E.toString(require('heatshrink').decompress(atob('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'))),
      32,
    atob("BwYHDgsSDwUICAoLBQkFCQwFDAwLCgsLCgwFBgsLCw4WDQ8MDwwNEA0FDAwPEQ4ODRAPDg8SDxcQDBEHCAgJDwYMCwoMCgkLCwUHDAUSDQsLDAsLCg0KEQsLCwkFCQsA"),
      30|65536
    );
  };

} else if (settings.font == 'Handlee') {
  // Handlee from Google fonts
  Graphics.prototype.setFontHandlee = function() {
    // Actual height 30 (29 - 0)
    return this.setFontCustom(
      E.toString(require('heatshrink').decompress(atob('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'))),
      32,
    atob("BwcKEhAWCgYIBw0OBRAHDxMKERAQEREPEg8HBw4SDg0QFRUWFxMSFxYHDhMQGhcYFBcVExMVFB8TEhMLDgsNFgsNDg0ODgkODwYGDgcUDg8ODgwNCw4NFAwNDQoGCREA"),
      30|65536
    );
  };
}


const numbers = [ 'twelve', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven' ];

const termsExactly = [ 'exactly', 'on the dot', 'precisely', 'bang on', 'spot on', 'right on' ];
const termsBefore = [ 'just before', 'before', 'coming up to', 'approaching' ];
const termsApprox = [ 'nearly', 'about', 'approx.', 'roughly', 'around', 'just about', 'more or less', 'close to', 'not far off', 'almost' ];
const termsAfter = [ 'just after', 'after', 'a little over', 'a bit later than' ];

function pickRandomTerm(terms) {
  return terms[Math.floor(Math.random() * terms.length)];
}

// draw fuzzy clock
function draw() {
  let now = new Date();
  let hours = now.getHours();
  let minutes = now.getMinutes();

  if (minutes >= 38)
    hours += 1;
  let hourStr = numbers[hours % 12];

  let metaTime = hours.toString();

  let timeStr = "It's ";
  let maybeInclOClock = true;

  if (minutes == 0 || minutes == 15 || minutes == 30 || minutes == 45) {
    timeStr += pickRandomTerm(termsExactly) + ' ';
    metaTime += 'exactly';
  } else if ((minutes >= 53 && minutes < 57) ||
             (minutes >=  8 && minutes < 12) ||
             (minutes >= 23 && minutes < 27) ||
             (minutes >= 38 && minutes < 42)) {
    timeStr += pickRandomTerm(termsBefore) + ' ';
    metaTime += 'before';
  } else if ( minutes >= 57 || minutes <  5  ||
             (minutes >= 12 && minutes < 20) ||
             (minutes >= 27 && minutes < 35) ||
             (minutes >= 42 && minutes < 50)) {
    timeStr += pickRandomTerm(termsApprox) + ' ';
    metaTime += 'approx';
  } else if ((minutes >=  5 && minutes <  8) ||
             (minutes >= 20 && minutes < 23) ||
             (minutes >= 35 && minutes < 38) ||
             (minutes >= 50 && minutes < 53)) {
    timeStr += pickRandomTerm(termsAfter) + ' ';
    metaTime += 'after';
  }

  if (minutes >= 53 || minutes <  8) {
    if (hours == 0) {
      timeStr += "midnight";
    } else if (hours == 12) {
      timeStr += "noon";
    } else {
      timeStr += hourStr + " o'clock";
    }
    maybeInclOClock = false;
    metaTime += 'oclock';
  } else if (minutes < 23) {
    timeStr += "quarter past " + hourStr;
    metaTime += 'quarterpast';
  } else if (minutes < 38) {
    timeStr += "half past " + hourStr;
    metaTime += 'halfpast';
  } else {
    timeStr += "quarter to " + hourStr;
    metaTime += 'quarterto';
  }

  if (metaTime == prevMetaTime) {
    // no need to update the display
    return;
  } else {
    prevMetaTime = metaTime;
  }

  if (maybeInclOClock && Math.random() > 0.7)
    timeStr += " o'clock";

  g.clear(true);

  g.setFontAlign(0, 0);
  if (settings.font == 'Gochi') {
    g.setFontGochiHand();
  } else if (settings.font == 'Delicious') {
    g.setFontDeliciousHandrawn();
  } else if (settings.font == 'Handlee') {
    g.setFontHandlee();
  } else {
    g.setFont("Vector", 26);
  }
  let lines = g.wrapString(timeStr, g.getWidth() - BORDER_WIDTH);
  g.drawString(lines.join("\n"), centerX, centerY, false);
}


// draw exact time (who wants to know that...)
function drawExact() {
  let now = new Date();

  g.clear(true);

  // time
  g.setFontAlign(0, 1).setFont("Vector", 50);
  g.drawString(require('locale').time(now, 1), centerX, centerY, false);

  // day of the week and month
  g.setFontAlign(0, -1).setFont("Vector", 30);
  g.drawString(require('locale').dow(now, 1) + ' ' + now.getDate(), centerX, centerY + 10, false);
}


// configure the interval to redraw the clock
function startClock() {
  setTimeout(function() {
    draw();
    drawInterval = setInterval(draw, 60000);
  }, 60000 - (Date.now() % 60000));
}


// draw and start clock
draw();
startClock();

// show exact time on tap
Bangle.on('touch', (button, xy) => {
  if (drawInterval) clearInterval(drawInterval);
  prevMetaTime = '';
  drawExact();
  setTimeout(function() {
    draw();
    startClock();
  }, 5000);
});

Bangle.setUI('clock');

// hideable widgets
Bangle.loadWidgets();
require("widget_utils").swipeOn();
