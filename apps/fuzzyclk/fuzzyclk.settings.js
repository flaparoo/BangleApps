(function(back) {
  var FILE = "fuzzyclk.json";

  var fonts = [ 'Handlee', 'Gochi', 'Delicious', 'Vector' ];

  // find a font (by name) in the list of available fonts
  function selectFont(font) {
    var fontIdx = 0;
    for (let i = 0; i < fonts.length; i++ ) {
      if (fonts[i] == settings.font) {
        fontIdx = i;
        break;
      }
    }
    return fontIdx;
  }

  // Load settings
  var settings = Object.assign({
    font: 'Handlee',
  }, require('Storage').readJSON(FILE, true) || {});

  function writeSettings() {
    require('Storage').writeJSON(FILE, settings);
  }

  // Show the menu
  E.showMenu({
    "" : { "title" : "Fuzzy Clock" },
    "< Back" : () => back(),
    'Font': {
      value: selectFont(settings.font),
      min: 0,
      max: fonts.length - 1,
      format: v => fonts[v],
      onchange: v => {
        settings.font = fonts[v];
        writeSettings();
      }
    },
  });
})
