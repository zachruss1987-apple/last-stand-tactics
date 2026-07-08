// Battle cutaway scene — owned by the Programmer + Graphics Designer. A Fire-Emblem-style
// modal that plays when an attack resolves: attacker vs defender in side view, lunge/hit/
// recoil, HP drain, floating damage, then returns to the board. Skippable (click) and
// toggleable. The engine awaits play() so board state updates after the animation.

const Phaser = window.Phaser;
const W = 480, H = 384, GROUND = 268;

export class BattleScene extends Phaser.Scene {
  constructor() { super('battle'); }

  init(data) { this.view = data.view; }

  create() {
    this.objs = [];
    this.active = false;
    this.view.battleScene = this;
    this.scene.bringToTop();
    this.input.on('pointerdown', () => { if (this.active) this.finish(); });
  }

  play(report) {
    return new Promise((resolve) => {
      this.active = true;
      this._done = () => { this.active = false; this.teardown(); resolve(); };
      this.build(report);
    });
  }

  add2(o) { this.objs.push(o); return o; }

  hpBar(x, y, w) {
    const g = this.add2(this.add.graphics());
    const draw = (r) => {
      g.clear();
      g.fillStyle(0x000000, 0.7); g.fillRect(x - 1, y - 1, w + 2, 7);
      const col = r > 0.5 ? 0x6bbf72 : r > 0.25 ? 0xd8a63c : 0xc65b4e;
      g.fillStyle(col, 1); g.fillRect(x, y, Math.max(0, w * r), 5);
    };
    return { g, draw };
  }

  fighter(cls, x, faceLeft) {
    const s = this.add2(this.add.image(x, GROUND, `unit-${cls}`).setOrigin(0.5, 1));
    s.setDisplaySize(96, 96);
    if (faceLeft) s.setFlipX(true);
    return s;
  }

  label(x, y, text, color) {
    return this.add2(this.add.text(x, y, text, {
      fontFamily: 'monospace', fontSize: '12px', color, stroke: '#000', strokeThickness: 3,
    }).setOrigin(0.5, 0.5));
  }

  build(report) {
    const { attacker: A, defender: D } = report;
    // backdrop
    const bg = this.add2(this.add.graphics());
    bg.fillStyle(0x0a0d0e, 0.94); bg.fillRect(0, 0, W, H);
    bg.fillStyle(0x141a16, 1); bg.fillRect(0, GROUND, W, H - GROUND);
    bg.lineStyle(2, 0x2c3336, 1); bg.strokeRect(2, 2, W - 4, H - 4);
    for (let i = 0; i < 6; i++) bg.fillRect(30 + i * 75, GROUND, 40, 3);

    const ax = 150, dx = 330;
    const atk = this.fighter(A.cls, ax, false);
    const def = this.fighter(D.cls, dx, true);
    this.label(ax, 300, A.name, '#d7d2c6');
    this.label(dx, 300, D.name, '#d7d2c6');
    const aBar = this.hpBar(ax - 48, 312, 96); aBar.draw(A.hpBefore / A.maxHp);
    const dBar = this.hpBar(dx - 48, 312, 96); dBar.draw(D.hpBefore / D.maxHp);
    this.label(ax, 326, `${A.hpBefore}/${A.maxHp}`, '#8b8f8a').setName('ahp');
    this.label(dx, 326, `${D.hpBefore}/${D.maxHp}`, '#8b8f8a').setName('dhp');
    const aHpTxt = this.objs.find((o) => o.name === 'ahp');
    const dHpTxt = this.objs.find((o) => o.name === 'dhp');
    this.label(W - 44, H - 16, 'SKIP ▸', '#8b8f8a');

    const drain = (bar, txt, from, to, max) => {
      const o = { v: from };
      this.tweens.add({
        targets: o, v: to, duration: 300, onUpdate: () => {
          bar.draw(o.v / max); txt.setText(`${Math.round(o.v)}/${max}`);
        },
      });
    };
    const popNumber = (x, dmg, color) => {
      const t = this.add2(this.add.text(x, 210, `-${dmg}`, {
        fontFamily: 'monospace', fontSize: '22px', color, stroke: '#000', strokeThickness: 4,
      }).setOrigin(0.5));
      this.tweens.add({ targets: t, y: 165, alpha: { from: 1, to: 0 }, duration: 700, ease: 'Cubic.out' });
    };
    const hit = (spr, flashColor) => {
      spr.setTint(0xffffff);
      this.time.delayedCall(90, () => spr.clearTint());
      this.cameras.main.shake(120, 0.012);
    };
    const fall = (spr) => this.tweens.add({ targets: spr, angle: faceAngle(spr), alpha: 0.15, y: GROUND + 10, duration: 350, ease: 'Cubic.in' });
    const faceAngle = (spr) => (spr.flipX ? -80 : 80);

    // timeline
    const tl = this.time;
    tl.delayedCall(260, () => {
      this.tweens.add({ targets: atk, x: ax + 46, duration: 130, yoyo: true, ease: 'Quad.out' });
    });
    tl.delayedCall(400, () => {
      if (report.hitDmg > 0) { hit(def); popNumber(dx, report.hitDmg, '#ff6b5a'); drain(dBar, dHpTxt, D.hpBefore, D.hpAfter, D.maxHp); }
      if (report.cleave) popNumber(dx + 24, report.cleave.dmg, '#ffb15a');
    });
    tl.delayedCall(560, () => { if (report.defenderDown) fall(def); });

    let end = 900;
    if (report.counterDmg > 0 && !report.defenderDown) {
      tl.delayedCall(720, () => { this.tweens.add({ targets: def, x: dx - 46, duration: 130, yoyo: true, ease: 'Quad.out' }); });
      tl.delayedCall(850, () => { hit(atk); popNumber(ax, report.counterDmg, '#ff6b5a'); drain(aBar, aHpTxt, A.hpBefore, A.hpAfter, A.maxHp); });
      tl.delayedCall(980, () => { if (report.attackerDown) fall(atk); });
      end = 1350;
    }
    this._endTimer = tl.delayedCall(end, () => this.finish());
  }

  finish() {
    if (!this.active) return;
    if (this._endTimer) this._endTimer.remove(false);
    this._done && this._done();
  }

  teardown() {
    this.tweens.killAll();
    this.time.removeAllEvents();
    for (const o of this.objs) o.destroy();
    this.objs = [];
  }
}
