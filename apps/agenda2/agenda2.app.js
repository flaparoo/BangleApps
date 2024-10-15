/*
 * Agenda2 - Another Agenda App - Banglejs
 */

const SHOW_DAYS = 3;
const HOURS_PAST = 2;

require("Font8x16").add(Graphics); 

const COLOUR_GREY          = 0x8410;   // same as: g.setColor(0.5, 0.5, 0.5)
const COLOUR_GREEN         = 0x07e0;   // same as: g.setColor(0, 1, 0)
const COLOUR_BLUE          = 0x001f;   // same as: g.setColor(0, 0, 1)
const COLOUR_YELLOW        = 0xffe0;   // same as: g.setColor(1, 1, 0)
const COLOUR_PINK          = 0xf810;   // same as: g.setColor(1, 0, 0.5)

const maxStart = Date.now() + SHOW_DAYS*86400000;  // in ms
const minEnd = Date.now() - HOURS_PAST*3600000;    // in ms
const dateColour = ( g.theme.dark ? COLOUR_GREEN : COLOUR_BLUE );
const sunColour = ( g.theme.dark ? COLOUR_YELLOW : COLOUR_PINK );

var allEvents;
var sunTimes = {};
var mainListView = [];
var detailsView = [];
var mainViewScroller;


// remove any special characters (ie. unicode)
function removeSpecialStrings(s) {
  if (s == undefined)
    return undefined;
  // remove weird Google meet header line that causes the Bangle to lock up:
  s = s.replace(/[:~][:~][:~][:~][:~][:~][:~][:~][:~][:~]+/g, '');
  // remove unicode characters:
  s = JSON.stringify(s);
  s = s.replace(/\\x[0-9a-fA-F][0-9a-fA-F]/g, '');
  s = s.replace(/\\u[0-9a-fA-F][0-9a-fA-F][0-9a-fA-F][0-9a-fA-F]/g, '');
  s = JSON.parse(s);
  // remove whitespaces/newlines from start and end of string:
  return s.trim();
}


/*
 * collect all events (from all sources)
 */
function getEvents() {
  allEvents = [];

  // get all Alarms / Timers / Events
  var alarms = require("sched").getAlarms();

  for (let idx in alarms) {
    let alarm = alarms[idx];

    if (! alarm.on) continue;

    let timeToAlarm = require("sched").getTimeToAlarm(alarm);
    if (! timeToAlarm) continue;

    let ts = new Date(Date.now() + timeToAlarm);
    if (ts > maxStart) continue;
    if (ts < minEnd) continue;

    let title = 'Alarm';
    if ("timer" in alarm) title = 'Timer';
    if ("date" in alarm) title = 'Event';

    allEvents.push({
      'start': ts,
      'end': undefined,
      'title': title,
      'location': '',
      'allday': false
    });
  }

  // get all Calendar events
  var calendar = require("Storage").readJSON("android.calendar.json",true)||[];
  for (let idx in calendar) {
    let event = calendar[idx];
    let msStart = event.timestamp * 1000;
    let msEnd = (event.timestamp + event.durationInSeconds) * 1000;

    if (msStart > maxStart) continue;
    if (msEnd < minEnd) continue;

    allEvents.push({
      'start': new Date(msStart),
      'end': new Date(msEnd),
      'title': removeSpecialStrings(event.title),
      'location': removeSpecialStrings(event.location),
      'description': removeSpecialStrings(event.description),
      'calName': removeSpecialStrings(event.calName),
      'allday': event.allDay
    });
  }

  // sort by start timestamp
  allEvents.sort( (a, b) => a.start.getTime() - b.start.getTime() );
}


/*
 * build the array of lines for the main view
 */
function buildMainView() {
  // first line is sunrise/sunset info
  mainListView.push({ t: 'sol' });

  // in case there are no upcoming events
  if (! allEvents.length) {
    mainListView.push({ t: 'empty' });
    mainListView.push({ t: 'empty' });
    mainListView.push({ t: 'title', title: 'You can relax!' });
    mainListView.push({ t: 'title', title: '-' });
    mainListView.push({ t: 'title', title: 'There are no' });
    mainListView.push({ t: 'title', title: 'upcoming events' });
    return;
  }

  // loop all events
  let prevDate = '';
  for (let eventIdx in allEvents) {
    let event = allEvents[eventIdx];

    // date + time line
    let date = require("locale").dow(event.start, 1) + ' ' +
               event.start.getDate() + '. ' + require("locale").month(event.start, 1);
    let time;
    if (event.allday) {
      time = 'All-day';
    } else {
      time = require("locale").time(event.start, 1).trim();
      if (event.end) {
        time += ' - ' + require("locale").time(event.end, 1).trim();
      }
    }
    mainListView.push({ t: 'datetime', i: eventIdx,
      date: (date != prevDate ? date : ''),
      time: time });
    prevDate = date;

    // title lines
    g.setFont("Vector", 20);
    for (let line of g.wrapString(event.title, g.getWidth()))
      mainListView.push({ t: 'title', i: eventIdx, title: line });

    // location (reduced to single line, if required)
    if (event.location) {
      g.setFont("6x15");
      var location = event.location;
      var locWidth = g.stringMetrics(location).width;
      var clipped = false;
      while (locWidth > (g.getWidth() - 7)) {
        location = location.slice(0, -1);
        locWidth = g.stringMetrics(location).width;
        clipped = true;
      }
      if (clipped)
        location += '...';
      mainListView.push({ t: 'location', i: eventIdx, location: location });
    }
  }
}


/*
 * draw a line from the main view
 */
function drawMainViewLine(idx, rect) {
  let line = mainListView[idx];
  let horizontalCenter = rect.x + (rect.w / 2);
  let rightAlign = rect.x + rect.w;

  switch (line.t) {
    case 'empty':
      break;

    case 'sol':
      // sunrise and sunset info
      g.setColor(sunColour).setFont("8x16");
      if ('sunrise' in sunTimes) {
        g.drawImage(atob("FBSBAAAAAAAAAAAABgAA8AAfgAAAAAAAAGAABgAYYYDAMAQCAB+AA/gAP8A//8H/+AAAAAAA"),
                    rect.x, rect.y);
        g.setFontAlign(-1, -1);
        g.drawString(require("locale").time(sunTimes.sunrise, 1).trim(), rect.x + 23, rect.y, false);
        g.drawImage(atob("FBSBAAAAAAAAAAAAH4AA8AAGAAAAAAAAAGAABgAYYYDAMAQCAB+AA/gAP8A//8H/+AAAAAAA"),
                    rightAlign - 20, rect.y);
        g.setFontAlign(1, -1);
        g.drawString(require("locale").time(sunTimes.sunset, 1), rightAlign - 23, rect.y + 5, false);
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
      g.setColor(g.theme.fg).setFontAlign(0, -1).setFont("Vector", 20);
      g.drawString(line.title, horizontalCenter, rect.y, false);
      break;

    case 'location':
      g.setColor(g.theme.fg).setFontAlign(0, -1).setFont("6x15");
      g.drawString(line.location, horizontalCenter, rect.y + 2, false);
      break;

    default:
      console.log('Unknown main view line type: '+line.t);
  }
}


/*
 * show the scroller for the main view
 */
function showMainView(scroll) {
  mainViewScroller = E.showScroller({
    h: 20,
    c: mainListView.length,
    scroll: scroll,
    draw: drawMainViewLine,
    select: (idx, touch) => {
      if ('i' in mainListView[idx])
        showEventDetails(mainListView[idx].i);
    }
  });
}


/*
 * draw a line from the details view
 */
function drawDetailsViewLine(idx, rect) {
  let line = detailsView[idx];
  let horizontalCenter = rect.x + (rect.w / 2);

  g.setFont("8x16");

  switch (line.t) {
    case 'empty':
      break;

    case 'title':
      g.setBgColor(g.theme.bg2).clearRect(rect);
      g.setColor(g.theme.fg).setFontAlign(0, -1);
      g.drawString(line.title, horizontalCenter, rect.y, false);
      break;

    case 'heading':
      g.setColor(dateColour).setFontAlign(-1, -1);
      g.drawString(line.line, rect.x, rect.y, false);
      break;

    case 'left':
      g.setColor(g.theme.fg).setFontAlign(-1, -1);
      g.drawString(line.line, rect.x, rect.y, false);
      break;

    case 'center':
      g.setColor(g.theme.fg).setFontAlign(0, -1);
      g.drawString(line.line, horizontalCenter, rect.y, false);
      break;

    default:
      console.log('Unknown details view line type: '+line.t);
  }
}


/*
 * build the array of lines for the details view and show the scroller
 */
function showEventDetails(eventIdx) {
  let event = allEvents[eventIdx];
  let mainViewScroll = mainViewScroller.scroll;

  g.setFont("8x16");

  detailsView = [];

  // title lines
  detailsView.push({ t: 'title', title: '' });
  for (let line of g.wrapString(event.title, g.getWidth()))
    detailsView.push({ t: 'title', title: line });
  detailsView.push({ t: 'title', title: '' });

  detailsView.push({ t: 'empty' });

  // date + time
  let date = require("locale").dow(event.start, 1) + ', ' +
             event.start.getDate() + '. ' + require("locale").month(event.start, 1) +
             ' ' + event.start.getFullYear();
  detailsView.push({ t: 'center', line: date });
  if (event.allday) {
    detailsView.push({ t: 'center', line: 'All-day' });
  } else {
    let time = require("locale").time(event.start, 1).trim();
    if (event.end) {
      time += ' - ' + require("locale").time(event.end, 1).trim();
    }
    detailsView.push({ t: 'center', line: time});
  }

  detailsView.push({ t: 'empty' });

  // location lines
  if (event.location) {
    detailsView.push({ t: 'heading', line: 'Location:' });
    for (let line of g.wrapString(event.location, g.getWidth()))
      detailsView.push({ t: 'left', line: line });
    detailsView.push({ t: 'empty' });
  }

  // description lines
  if (event.description) {
    detailsView.push({ t: 'heading', line: 'Description:' });
    for (let line of g.wrapString(event.description, g.getWidth()))
      detailsView.push({ t: 'left', line: line });
    detailsView.push({ t: 'empty' });
  }

  // from which calendar
  if (event.calName) {
    detailsView.push({ t: 'heading', line: 'From Calendar:' });
    detailsView.push({ t: 'left', line: event.calName });
    detailsView.push({ t: 'empty' });
  }

  // back "button"
  detailsView.push({ t: 'center', line: '< Back' });
  detailsView.push({ t: 'empty' });


  // show details in scroller
  E.showScroller({
    h: 16,
    c: detailsView.length,
    draw: drawDetailsViewLine,
    select: (idx, touch) => {
      if (idx >= detailsView.length - 3)
        showMainView(mainViewScroll);
    },
    back: () => showMainView(mainViewScroll)
  });
}


/*
 * initialise
 */
var mylocation = require("Storage").readJSON("mylocation.json",1)||{};
if ('lat' in mylocation && 'lon' in mylocation) {
  var now = new Date(Date.now());
  sunTimes = require("suncalc").getTimes(now, mylocation.lat, mylocation.lon);
}
getEvents();
buildMainView();
showMainView(0);

// exit on button press
setWatch(e => { Bangle.showClock(); }, BTN1);


// for debugging:
//console.log(allEvents);
