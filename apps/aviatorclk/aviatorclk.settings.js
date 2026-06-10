(function(back) {
  var FILE = "aviatorclk.json";

  // Load settings
  var settings = Object.assign({
    showSeconds: true,
    invertScrolling: false,
    wxProvider: 'avwx',
  }, require('Storage').readJSON(FILE, true) || {});

  var wxProviders = [ 'avwx', 'checkwx' ];
  var wxProviderIdx = wxProviders.indexOf(settings.wxProvider);
  if (wxProviderIdx < 0)
    wxProviderIdx = 0;

  function writeSettings() {
    require('Storage').writeJSON(FILE, settings);
  }

  // Show the menu
  E.showMenu({
    "" : { "title" : "AV8R Clock" },
    "< Back" : () => back(),
    'Show Seconds': {
      value: !!settings.showSeconds,  // !! converts undefined to false
      onchange: v => {
        settings.showSeconds = v;
        writeSettings();
      }
    },
    'Invert Scrolling': {
      value: !!settings.invertScrolling,  // !! converts undefined to false
      onchange: v => {
        settings.invertScrolling = v;
        writeSettings();
      }
    },
    'WX module': {
      value: parseInt(wxProviderIdx) || 0,
      min: 0,
      max: wxProviders.length - 1,
      format: v => { return wxProviders[v]; },
      onchange: v => {
        settings.wxProvider = wxProviders[v];
        writeSettings();
      }
    },
  });
})
