const SpriteLoader = {
  // paths: array of relative paths to image files
  load(paths){
    const results = {};
    if(!paths || paths.length===0) return Promise.resolve(results);
    let count = 0, total = paths.length;
    return new Promise((resolve)=>{
      paths.forEach(p => {
        const img = new Image();
        img.onload = () => { results[p] = img; count++; if(count===total) resolve(results); };
        img.onerror = () => { results[p] = null; count++; if(count===total) resolve(results); };
        img.src = p;
      });
    });
  }
};

// How to integrate your sprite-generation method:
// - If your method returns Image objects or data-URIs, push those paths/objects into an array
//   and call `SpriteLoader.load(paths)` to get `{ path: Image }` mapping.
// - Alternatively, replace this file with a thin adapter that calls your generator and
//   returns the same shape (promise resolving to a mapping of keys -> Image).
