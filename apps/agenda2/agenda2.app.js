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
  let y = scrollOffset;
  let prevDate = '';

  g.clear(true);

  if (! allEvents.length) {
    g.setColor(dateColour).setFontAlign(0, 0).setFont("Vector", 20);
    let msg = g.wrapString('You can relax - there are no upcoming events!', g.getWidth());
    g.drawString(msg.join("\n"), g.getWidth()/2, g.getHeight()/2, false);
    return;
  }

  for (let idx in allEvents) {
    let event = allEvents[idx];

    let date = event.start.as('T D. C').str;

    // separator
    if (date != prevDate) {
      g.setColor(dateColour);
      if (y > -4 && y < g.getHeight())
        g.fillRect(0, y, g.getWidth(), y + 2);
      y += 4;
    } else {
      g.setColor(COLOUR_GREY);
      if (y > -2 && y < g.getHeight())
        g.drawLine(0, y, g.getWidth(), y);
      y += 2;
    }

    // date
    g.setFont("8x16");
    if (date != prevDate) {
      g.setFontAlign(1, -1);
      if (y > -16 && y < g.getHeight())
        g.drawString(date, g.getWidth(), y, false);
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
    g.setFontAlign(-1, -1);
    if (y > -16 && y < g.getHeight())
      g.drawString(time, 0, y, false);
    y += 16;

    // title
    g.setFontAlign(0, -1).setFont("Vector", 20);
    let titleLines = g.wrapString(event.title, g.getWidth());
    let titleHeight = g.stringMetrics(titleLines.join("\n")).height + 1;
    if (y > titleHeight * -1 && y < g.getHeight())
      g.drawString(titleLines.join("\n"), g.getWidth()/2, y, false);
    y += titleHeight;

    // location
    if (event.loc) {
      g.setFontAlign(-1, -1).setFont("6x15");
      let locLines = g.wrapString(event.loc, g.getWidth());
      let locHeight = g.stringMetrics(locLines.join("\n")).height;
      if (y > locHeight * -1 && y < g.getHeight())
        g.drawString(locLines.join("\n"), 0, y, false);
      y += locHeight;
    }

    y += 1;
  }

  maxScrollOffset = (y - scrollOffset - g.getHeight()) * -1;
}


// initialise
getEvents();
drawEvents();

// scroll (up/down swipes)
Bangle.setUI("updown", action => {
  switch (action) {
    case -1:  // up
      if (scrollOffset > maxScrollOffset) {
        scrollOffset -= 40;
        if (scrollOffset < maxScrollOffset) { scrollOffset = maxScrollOffset; }
      }
      break;
    case 1:   // down
      if (scrollOffset < 0) {
        scrollOffset += 40;
        if (scrollOffset > 0) { scrollOffset = 0; }
      }
      break;
    default:
      // ignore taps
  }
  drawEvents();
});
// exit on button press
setWatch(e => { Bangle.showClock(); }, BTN1);



// for debugging:
//console.log(allEvents);

