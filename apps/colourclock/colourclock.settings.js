(function(back) {
  var FILE = "colourclock.json";

  // Load settings
  var settings = Object.assign({
    showSeconds: true,
    handStyle: 0,      // colourful
  }, require('Storage').readJSON(FILE, true) || {});

  function writeSettings() {
    require('Storage').writeJSON(FILE, settings);
  }

  // Show the menu
  E.showMenu({
    "" : { "title" : "Colour Clock" },
    "< Back" : () => back(),
    'Show Seconds': {
      value: !!settings.showSeconds,  // !! converts undefined to false
      onchange: v => {
        settings.showSeconds = v;
        writeSettings();
      }
    },
    'Hand style': {
      value: parseInt(settings.handStyle) || 0,
      min: 0,
      max: 1,
      format: v => {
        switch (v) {
          case 0: return 'Colour';
          case 1: return 'Theme';
        }
      },
      onchange: v => {
        settings.handStyle = v;
        writeSettings();
      }
    },
  });
})
