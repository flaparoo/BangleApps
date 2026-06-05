(function(back) {
  var FILE = "avi8orclk.json";

  // Load settings
  var settings = Object.assign({
    showSeconds: false,
    useMyLocation: false,
    gpsUpdateInterval: 60,
  }, require('Storage').readJSON(FILE, true) || {});

  function writeSettings() {
    require('Storage').writeJSON(FILE, settings);
  }

  // Show the menu
  E.showMenu({
    "" : { "title" : "Avi8or Clock" },
    "< Back" : () => back(),
    'Show Seconds': {
      value: !!settings.showSeconds,  // !! converts undefined to false
      onchange: v => {
        settings.showSeconds = v;
        writeSettings();
      }
    },
    'Use My Location': {
      value: !!settings.useMyLocation,  // !! converts undefined to false
      onchange: v => {
        settings.useMyLocation = v;
        writeSettings();
      }
    },
    'GPS Update Interval': {  // minutes
      value: settings.gpsUpdateInterval || 60,
      min: 10,
      max: 1440,  // 24h
      step: 10,
      onchange: v => {
        settings.gpsUpdateInterval = v;
        writeSettings();
      }
    },
  });
})
