(function(back) {
  var FILE = "colourclock.json";

  // Load settings
  var settings = Object.assign({
    showSeconds: true,
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
      format: v => v ? "On" : "Off",
      onchange: v => {
        settings.showSeconds = v;
        writeSettings();
      }
    },
  });
})
