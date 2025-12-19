const Input = {
  keys: {},
  init() {
    window.addEventListener('keydown', e => {
      const k = (e.key || '').toString().toLowerCase();
      this.keys[k] = true;
      // prevent arrow keys and space from scrolling the page
      if (k.startsWith('arrow') || ['w', 'a', 's', 'd', ' '].includes(k)) e.preventDefault();
    });
    window.addEventListener('keyup', e => {
      const k = (e.key || '').toString().toLowerCase();
      this.keys[k] = false;
      if (k.startsWith('arrow') || ['w', 'a', 's', 'd', ' '].includes(k)) e.preventDefault();
    });
  },
  isDown(key) { if (!key) return false; return !!this.keys[key.toString().toLowerCase()]; }
};