(function(back) {
  var FILE = 'avweather.json';

  // Load settings
  var settings = Object.assign({
    font: 2,  // Large
  }, require('Storage').readJSON(FILE, true) || {});

  function writeSettings() {
    require('Storage').writeJSON(FILE, settings);
  }

  // Show the main menu
  E.showMenu({
    '': { 'title' : 'AvWeather' },
    '< Back': () => back(),
    'Font': {
      value: parseInt(settings.font) || 0,
      min: 0,
      max: 2,
      format: v => {
        switch (v) {
          case 0: return 'Small';
          case 1: return 'Medium';
          case 2: return 'Large';
        }
        return 'L';
      },
      onchange: v => {
        settings.font = v;
        writeSettings();
      }
    }
  });
})
