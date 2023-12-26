(() => {
  function draw() {
    require("Font8x12").add(Graphics);
    let m = process.memory();
    let percent = Math.round(m.usage * 100 / m.total);
    g.setFontAlign(0,0).setColor(percent > 70 ? "#ff0000" : (percent > 50 ? "#ffff00" : g.theme.fg ));
    g.setFont('6x8').drawString('RAM', this.x + 12, this.y + 5, false);
    g.clearRect(this.x, this.y + 12, this.x + 24, this.y + 24);
    g.setFont("8x12").drawString(percent + "%", this.x + 12, this.y + 18, false);
  }

  setInterval(()=>WIDGETS.ram.draw(WIDGETS.ram), 10000);

  WIDGETS.ram = {
    area: 'tl',
    width: 24,
    draw: draw
  };
})();
