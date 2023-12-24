/*
 * Agenda2 - Another Agenda App - Banglejs
 */

const SHOW_DAYS = 3;
const HOURS_PAST = 3;

require("Font8x16").add(Graphics); 

const COLOUR_GREY          = 0x8410;   // same as: g.setColor(0.5, 0.5, 0.5)
const COLOUR_GREEN         = 0x07e0;   // same as: g.setColor(0, 1, 0)
const COLOUR_BLUE          = 0x001f;   // same as: g.setColor(0, 0, 1)
const COLOUR_YELLOW        = 0xffe0;   // same as: g.setColor(1, 1, 0)
const COLOUR_DARK_YELLOW   = 0x8400;   // same as: g.setColor(0.5, 0.5, 0)

const eventAreaHeight = g.getHeight() - 10;
const maxStart = Date.now() + SHOW_DAYS*86400000;
const minStart = Date.now() - HOURS_PAST*3600000;
const dateColour = ( g.theme.dark ? COLOUR_GREEN : COLOUR_BLUE );
const sunColour = ( g.theme.dark ? COLOUR_YELLOW : COLOUR_DARK_YELLOW );

var allEvents;
var sunTimes = {};
var scrollOffset = 0;
var maxScrollOffset = 0;


function getEvents() {
  allEvents = [];

  // get all Alarms / Timers / Events
  var alarms = require("sched").getAlarms();
  var activeAlarms = require("sched").getActiveAlarms(alarms);

  for (let idx in alarms) {
    let alarm = alarms[idx];

    if (! alarm.on) continue;

    let timeToAlarm = require("sched").getTimeToAlarm(alarm);
    if (! timeToAlarm) continue;

    let ts = new Date(Date.now() + timeToAlarm);
    if (ts > maxStart) continue;
    if (ts < minStart) continue;

    let title = 'Alarm';
    if ("timer" in alarm) title = 'Timer';
    if ("date" in alarm) title = 'Event';

    allEvents.push({
      'start': ts,
      'end': undefined,
      'title': title,
      'loc': '',
      'allday': false
    });
  }

  // get all Calendar events
  var calendar = require("Storage").readJSON("android.calendar.json",true)||[];
  for (let idx in calendar) {
    let event = calendar[idx];

    if (event.timestamp*1000 > maxStart) continue;
    if (event.timestamp*1000 < minStart) continue;

    let start = new Date(event.timestamp*1000);
    let end = new Date((event.timestamp + event.durationInSeconds)*1000);
    let title = event.title;
    let loc = event.location;
    let allday = event.allDay;
    allEvents.push({
      'start': start,
      'end': end,
      'title': title,
      'loc': loc,
      'allday': allday
    });
  }

  // sort by start timestamp
  allEvents.sort( (a, b) => a.start.getTime() - b.start.getTime() );
}


function drawEvents() {
  g.clear(true);

  let y = 0;
  let prevDate = '';
  let horizontalCenter = g.getWidth() / 2;

  // sunrise and sunset info
  if (! scrollOffset) {
    g.setColor(sunColour);
    g.setFont("8x16");
    if ('sunrise' in sunTimes) {
      g.setFontAlign(-1, -1);
      g.drawString(require("locale").time(sunTimes.sunrise, 1).trim(), 0, y, false);
      g.setFontAlign(0, -1);
      g.drawString('< Sun >', horizontalCenter, y, false);
      g.setFontAlign(1, -1);
      g.drawString(require("locale").time(sunTimes.sunset, 1), g.getWidth(), y, false);
    } else {
      g.setFontAlign(0, -1);
      g.drawString('*"My Location" not set*', horizontalCenter, y, false);
    }
    y += 16;
  }

  if (! allEvents.length) {
    g.setColor(dateColour).setFontAlign(0, 0).setFont("Vector", 20);
    let msg = g.wrapString('You can relax - there are no upcoming events!', g.getWidth());
    g.drawString(msg.join("\n"), horizontalCenter, g.getHeight() / 2, false);
    return;
  }

  maxScrollOffset = allEvents.length - 1;

  // up arrow (if not showing first event)
  if (scrollOffset) {
    g.setColor(dateColour);
    g.fillRect(0, 0, g.getWidth(), 7);
    g.setColor(g.theme.bg);
    g.fillPoly([ horizontalCenter, 0,
                 horizontalCenter + 7, 7,
                 horizontalCenter - 7, 7 ]);
    y += 8;
  }

  for (let idx = scrollOffset; idx < allEvents.length; idx++) {
    let event = allEvents[idx];

    let date = require("locale").dow(event.start, 1) + ' ' +
               event.start.getDate() + '. ' + require("locale").month(event.start, 1);

    // separator
    if (date != prevDate) {
      g.setColor(dateColour);
      g.fillRect(0, y, g.getWidth(), y + 2);
      y += 4;
    } else {
      g.setColor(COLOUR_GREY);
      g.drawLine(0, y, g.getWidth(), y);
      y += 2;
    }

    if (y < eventAreaHeight) {
      // date
      g.setFont("8x16");
      if (date != prevDate) {
        g.setFontAlign(-1, -1);
        g.drawString(date, 0, y, false);
        prevDate = date;
      }

      // time
      let time = '';
      if (event.allday) {
        time = 'All-day';
      } else {
        time = require("locale").time(event.start, 1);
        if (event.end) {
          time += ' - ' + require("locale").time(event.end, 1);
        }
      }
      g.setColor(g.theme.fg);
      g.setFontAlign(1, -1);
      g.drawString(time, g.getWidth(), y, false);

      y += 16;
    }

    // title
    if (y < eventAreaHeight) {
      g.setFontAlign(0, -1).setFont("Vector", 20);
      let titleLines = g.wrapString(event.title, g.getWidth());
      let titleHeight = g.stringMetrics(titleLines.join("\n")).height + 1;
      g.drawString(titleLines.join("\n"), horizontalCenter, y, false);
      y += titleHeight;
    }

    // location
    if (event.loc && y < eventAreaHeight) {
      g.setFontAlign(0, -1).setFont("6x15");
      let locLines = g.wrapString(event.loc, g.getWidth());
      let locHeight = g.stringMetrics(locLines.join("\n")).height;
      g.drawString(locLines.join("\n"), horizontalCenter, y, false);
      y += locHeight;
    }

    if (y >= eventAreaHeight) {
      // more events than fit on screen -> show down arrow
      g.setColor(dateColour);
      g.fillRect(0, g.getHeight() - 10, g.getWidth(), g.getHeight());
      g.setColor(g.theme.bg);
      g.fillPoly([ horizontalCenter, g.getHeight() - 1,
                   horizontalCenter + 7, g.getHeight() - 7,
                   horizontalCenter - 7, g.getHeight() - 7 ]);
      break;
    }

    y += 1;
  }
  if (y <= eventAreaHeight)
    maxScrollOffset = scrollOffset;
}


// initialise
var mylocation = require("Storage").readJSON("mylocation.json",1)||{};
if ('lat' in mylocation && 'lon' in mylocation) {
  var now = new Date(Date.now());
  sunTimes = require("suncalc").getTimes(now, mylocation.lat, mylocation.lon);
}
getEvents();
drawEvents();

// scroll (up/down taps)
Bangle.on('touch', (button, xy) => {
  if (xy.y >= g.getHeight() / 2) {
    // scroll down
    scrollOffset++;
    if (scrollOffset > maxScrollOffset) scrollOffset = maxScrollOffset;
  } else {
    // scroll up
    scrollOffset--;
    if (scrollOffset < 0) scrollOffset = 0;
  }
  drawEvents();
});
// exit on button press
setWatch(e => { Bangle.showClock(); }, BTN1);



// for debugging:
//console.log(allEvents);

