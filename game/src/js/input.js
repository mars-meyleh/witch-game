const Input = {
  keys: {},
  init(){
    window.addEventListener('keydown', e => { this.keys[e.key] = true; e.preventDefault(); });
    window.addEventListener('keyup', e => { this.keys[e.key] = false; e.preventDefault(); });
  },
  isDown(key){ return !!this.keys[key]; }
};