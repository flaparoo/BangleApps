/*
 * Agenda2 - Another Agenda App - Banglejs
 */

const SHOW_DAYS = 3;

require('DateExt');
require("Font8x16").add(Graphics); 

const COLOUR_GREY          = 0x8410;   // same as: g.setColor(0.5, 0.5, 0.5)
const COLOUR_GREEN         = 0x07e0;   // same as: g.setColor(0, 1, 0)
const COLOUR_BLUE          = 0x001f;   // same as: g.setColor(0, 0, 1)

const maxStart = Date.now() + SHOW_DAYS*86400000;
const dateColour = ( g.theme.dark ? COLOUR_GREEN : COLOUR_BLUE );

var allEvents;
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

  if (! allEvents.length) {
    g.setColor(dateColour).setFontAlign(0, 0).setFont("Vector", 20);
    let msg = g.wrapString('You can relax - there are no upcoming events!', g.getWidth());
    g.drawString(msg.join("\n"), g.getWidth()/2, g.getHeight()/2, false);
    return;
  }

  let y = 0;
  let prevDate = '';

  maxScrollOffset = allEvents.length - 1;

  // up arrow (if not showing first event)
  if (scrollOffset) {
    g.setColor(dateColour);
    g.fillRect(0, 0, g.getWidth(), 7);
    g.setColor(g.theme.bg);
    let horizontalCenter = g.getWidth() / 2;
    g.fillPoly([ horizontalCenter, 0,
                 horizontalCenter + 7, 7,
                 horizontalCenter - 7, 7 ]);
    y += 8;
  }

  for (let idx = scrollOffset; idx < allEvents.length; idx++) {
    let event = allEvents[idx];

    let date = event.start.as('T D. C').str;

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

    // date
    g.setFont("8x16");
    if (date != prevDate) {
      g.setFontAlign(-1, -1);
      if (y < g.getHeight())
        g.drawString(date, 0, y, false);
      prevDate = date;
    }

    // time
    let time = '';
    if (event.allday) {
      time = 'All-day';
    } else {
      time = event.start.as("h:0m").str;
      if (event.end) {
        time += ' - ' + event.end.as("h:0m").str;
      }
    }
    g.setColor(g.theme.fg);
    g.setFontAlign(1, -1);
    if (y < g.getHeight())
      g.drawString(time, g.getWidth(), y, false);
    y += 16;

    // title
    g.setFontAlign(0, -1).setFont("Vector", 20);
    let titleLines = g.wrapString(event.title, g.getWidth());
    let titleHeight = g.stringMetrics(titleLines.join("\n")).height + 1;
    if (y < g.getHeight())
      g.drawString(titleLines.join("\n"), g.getWidth()/2, y, false);
    y += titleHeight;

    // location
    if (event.loc) {
      g.setFontAlign(-1, -1).setFont("6x15");
      let locLines = g.wrapString(event.loc, g.getWidth());
      let locHeight = g.stringMetrics(locLines.join("\n")).height;
      if (y < g.getHeight())
        g.drawString(locLines.join("\n"), 0, y, false);
      y += locHeight;
    }

    if (y >= g.getHeight()) {
      // more events than fit on screen -> show down arrow
      g.setColor(dateColour);
      g.fillRect(0, g.getHeight() - 10, g.getWidth(), g.getHeight());
      g.setColor(g.theme.bg);
      let horizontalCenter = g.getWidth() / 2;
      g.fillPoly([ horizontalCenter, g.getHeight() - 1,
                   horizontalCenter + 7, g.getHeight() - 7,
                   horizontalCenter - 7, g.getHeight() - 7 ]);
      break;
    }

    y += 1;
  }
  if (y <= g.getHeight())
    maxScrollOffset = scrollOffset;
}


// initialise
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

