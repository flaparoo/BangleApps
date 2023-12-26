/*
 * Analog Clock
 */

const COLOUR_GREY          = 0x8410;   // same as: g.setColor(0.5, 0.5, 0.5)
const COLOUR_RED           = 0xf800;   // same as: g.setColor(1, 0, 0)
const COLOUR_CYAN          = 0x07ff;   // same as: g.setColor(0, 1, 1)

const centerX = g.getWidth() / 2;
const centerY = g.getHeight() / 2;
const outerRadius = Math.min(centerX, centerY) * 0.95;
const numbersRadius = Math.min(centerX, centerY) * 0.8;
const innerRadius = Math.min(centerX, centerY) * 0.62;
const twoPI = Math.PI * 2;

const hourHandWidth = 2 * 3;
const hourHandLength = innerRadius * 0.68;
const minuteHandWidth  = 2 * 2;
const minuteHandLength = innerRadius * 0.95;
const secondHandOffset = 6;
const secondHandLength = innerRadius * 0.98;

var drawInterval;

// read in the settings
var settings = Object.assign({
  showSeconds: true,
}, require('Storage').readJSON('colourclock.json', true) || {});


// draw the hour or minute hand
function drawClockHand(width, length, rotate) {
  const halfWidth = width / 2;
  const polygon = [
    -halfWidth, halfWidth,
    -halfWidth, -length,
             0, -length - halfWidth,
     halfWidth, -length,
     halfWidth, halfWidth,
             0, halfWidth * 2
  ];
  const sinRotate = Math.sin(rotate);
  const cosRotate = Math.cos(rotate);

  let translatedPolygon = [];
  for (let i = 0; i < polygon.length; i+=2) {
    let x = polygon[i];
    let y = polygon[i+1];
    translatedPolygon[i]     = centerX + x * cosRotate + y * sinRotate;
    translatedPolygon[i + 1] = centerY + x * sinRotate - y * cosRotate;
  }
  g.fillPoly(translatedPolygon);
}

// draw top part of clock (main time, date and UTC)
function draw() {
  let now = new Date();
  let hours = now.getHours() % 12;
  let minutes = now.getMinutes();
  let seconds = now.getSeconds();

  // clear the inner area
  g.setColor(g.theme.bg);
  g.fillCircle(centerX, centerY, innerRadius);

  // hour hand
  let hoursAngle = (hours + (minutes / 60)) / 12 * twoPI - Math.PI;
  g.setColor(g.theme.fg);
  drawClockHand(hourHandWidth, hourHandLength, hoursAngle);

  // minute hand
  let minutesAngle = (minutes / 60) * twoPI - Math.PI;
  g.setColor(COLOUR_GREY);
  drawClockHand(minuteHandWidth, minuteHandLength, minutesAngle);

  // seconds hand
  if (settings.showSeconds) {
    let secondsAngle = (seconds / 60) * twoPI - Math.PI;
    let sinSeconds = Math.sin(secondsAngle);
    let cosSeconds = Math.cos(secondsAngle);
    g.setColor(COLOUR_RED);
    g.drawLine(
      centerX + secondHandOffset * sinSeconds,
      centerY - secondHandOffset * cosSeconds,
      centerX - secondHandLength * sinSeconds,
      centerY + secondHandLength * cosSeconds
    );
  }

  g.setColor(g.theme.bg).drawCircle(centerX, centerY, 4);

  // day of the week and month
  g.setFontAlign(0, 0).setFont("Vector", 18).setColor(COLOUR_CYAN);
  g.drawString(
    require("locale").dow(now, 1).toUpperCase() + ' ' + now.getDate(),
    centerX, centerY + 27, false);
}


// initialise and draw static content
g.clear(true);

for (let i = 0; i < 60; i++) {
  let p = i * twoPI / 60;
  let x = centerX + outerRadius * Math.sin(p);
  let y = centerY - outerRadius * Math.cos(p);
  let colour = E.HSBtoRGB(i / 60, 1, 1, true);
  g.setColor(colour[0] / 255, colour[1] / 255, colour[2] / 255);
  g.fillCircle(x, y, 1);
}

g.setFontAlign(0, 0).setFont('Vector', 20);
for (let i = 0; i < 12; i++) {
  let p = i * twoPI / 12;
  let r = numbersRadius;
  if (i >= 10) { r -= 4; }
  let x = centerX + r * Math.sin(p) + 1;
  let y = centerY - r * Math.cos(p) + 2;
  let colour = E.HSBtoRGB(i / 12, 1, 1, true);
  g.setColor(colour[0] / 255, colour[1] / 255, colour[2] / 255);
  g.drawString(i == 0 ? '12' : i.toString(), x, y);
}


// draw and start clock
draw();

let updateFreq = ( settings.showSeconds ? 1000 : 60000 );
setTimeout(function() {
  draw();
  drawInterval = setInterval(draw, updateFreq);
}, updateFreq - (Date.now() % updateFreq));

Bangle.setUI('clock');


// hideable widgets
Bangle.loadWidgets();
require("widget_utils").swipeOn();

