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
var lines = [];


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


function buildLines() {
  // first line is sunrise/sunset info
  lines.push({ t: 'sol' });

  // in case there are no upcoming events
  if (! allEvents.length) {
    lines.push({ t: 'empty' });
    lines.push({ t: 'empty' });
    lines.push({ t: 'title', title: 'You can relax!' });
    lines.push({ t: 'title', title: '-' });
    lines.push({ t: 'title', title: 'There are no' });
    lines.push({ t: 'title', title: 'upcoming events' });
    return;
  }

  // loop all events
  let prevDate = '';
  for (let event of allEvents) {
    let date = require("locale").dow(event.start, 1) + ' ' +
               event.start.getDate() + '. ' + require("locale").month(event.start, 1);
    let time;
    if (event.allday) {
      time = 'All-day';
    } else {
      time = require("locale").time(event.start, 1);
      if (event.end) {
        time += ' - ' + require("locale").time(event.end, 1);
      }
    }

    // date + time line
    lines.push({ t: 'datetime', date: (date != prevDate ? date : ''), time: time });
    prevDate = date;

    // title lines
    g.setFont("Vector", 20);
    let titleLines = g.wrapString(event.title, g.getWidth());
    for (let line of titleLines) {
      lines.push({ t: 'title', title: line });
    }

    // location
    if (event.loc) {
      g.setFont("6x15");
      var locWidth = g.stringMetrics(event.loc).width;
      var clipped = false;
      while (locWidth > (g.getWidth() - 7)) {
        event.loc = event.loc.slice(0, -1);
        locWidth = g.stringMetrics(event.loc).width;
        clipped = true;
      }
      if (clipped)
        event.loc += '...';
      lines.push({ t: 'loc', loc: event.loc });
    }
  }
}


function drawLine(idx, rect) {
  let line = lines[idx];
  let horizontalCenter = rect.x + (rect.w / 2);
  let rightAlign = rect.x + rect.w;

  switch (line.t) {
    case 'empty':
      break;

    case 'sol':
      // sunrise and sunset info
      g.setColor(sunColour).setFont("8x16");
      if ('sunrise' in sunTimes) {
        g.setFontAlign(-1, -1);
        g.drawString(require("locale").time(sunTimes.sunrise, 1).trim(), rect.x, rect.y, false);
        g.setFontAlign(0, -1);
        g.drawString('< Daylight >', horizontalCenter, rect.y + 2, false);
        g.setFontAlign(1, -1);
        g.drawString(require("locale").time(sunTimes.sunset, 1), rightAlign, rect.y + 4, false);
      } else {
        g.setFontAlign(0, -1);
        g.drawString('*"My Location" not set*', horizontalCenter, rect.y + 2, false);
      }
      break;

    case 'datetime':
      g.setFont("8x16");

      // separator line
      if (line.date) {
        g.setColor(dateColour).fillRect(rect.x, rect.y, rightAlign, rect.y + 2);
        // also print date
        g.setFontAlign(-1, -1).drawString(line.date, rect.x, rect.y + 4, false);
      } else {
        g.setColor(COLOUR_GREY).drawLine(rect.x, rect.y + 2, rightAlign, rect.y + 2);
      }

      // time
      g.setColor(g.theme.fg).setFontAlign(1, -1);
      g.drawString(line.time, rightAlign, rect.y + 4, false);
      break;

    case 'title':
      // title line
      g.setColor(g.theme.fg).setFontAlign(0, -1).setFont("Vector", 20);
      g.drawString(line.title, horizontalCenter, rect.y, false);
      break;

    case 'loc':
      // location
      g.setColor(g.theme.fg).setFontAlign(0, -1).setFont("6x15");
      g.drawString(line.loc, horizontalCenter, rect.y + 2, false);
      break;

    default:
      console.log('Unknown line type: '+line.t);
  }
}


// initialise
var mylocation = require("Storage").readJSON("mylocation.json",1)||{};
if ('lat' in mylocation && 'lon' in mylocation) {
  var now = new Date(Date.now());
  sunTimes = require("suncalc").getTimes(now, mylocation.lat, mylocation.lon);
}
getEvents();
buildLines();

// show events in scroller
E.showScroller({
  h: 20,
  c: lines.length,
  draw: drawLine,
  select: (idx, touch) => {
    // do nothing for any tap
  },
  //back: () => load()
});

// exit on button press
setWatch(e => { Bangle.showClock(); }, BTN1);


// for debugging:
//console.log(allEvents);
