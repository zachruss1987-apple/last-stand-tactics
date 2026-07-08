// Input wiring — connects DOM events to the game controller. Kept thin: it translates
// clicks into controller calls and nothing more.

export function attachInput(game, audio, els) {
  // First interaction unlocks the audio context (browser autoplay policy).
  // Board clicks are handled by the Phaser view (see phaser-view.js); here we wire the
  // DOM HUD controls and keyboard shortcuts.
  const unlockAudio = () => audio.ensure();

  els.btnEndTurn.addEventListener('click', () => { unlockAudio(); game.endTurn(); });
  if (els.btnGuard) els.btnGuard.addEventListener('click', () => { unlockAudio(); game.guard(); });
  els.btnWait.addEventListener('click', () => { unlockAudio(); game.wait(); });
  els.btnCancel.addEventListener('click', () => { unlockAudio(); game.cancelMove(); });
  els.btnRestart.addEventListener('click', () => { unlockAudio(); game.reset(); });

  els.btnMute.addEventListener('click', () => {
    unlockAudio();
    const muted = !audio.muted;
    audio.setMuted(muted);
    els.btnMute.textContent = muted ? '🔇 Muted' : '🔊 Sound';
    els.btnMute.classList.toggle('muted', muted);
  });

  // Overlay "Play Again" button is re-created on each render — delegate from document.
  document.addEventListener('click', (e) => {
    if (e.target && e.target.id === 'btn-restart-overlay') {
      unlockAudio();
      game.reset();
    }
  });

  // Keyboard shortcuts: Space/E end turn, W wait, Esc cancel/deselect.
  document.addEventListener('keydown', (e) => {
    if (e.repeat) return;
    if (e.key === 'e' || e.key === 'E' || e.key === ' ') { e.preventDefault(); game.endTurn(); }
    else if (e.key === 'w' || e.key === 'W') { game.wait(); }
    else if (e.key === 'g' || e.key === 'G') { game.guard(); }
    else if (e.key === 'Escape') { game.step === 'action' ? game.cancelMove() : game.deselect(); }
  });
}
