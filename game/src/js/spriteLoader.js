// Simple sprite loader: fetches PNG files and exposes them as window globals
const SpriteLoader = {
  async load(spriteMap) {
    // spriteMap: { windowVarName: 'path/to/file.png', ... }
    const results = {};
    const promises = Object.entries(spriteMap).map(async ([varName, path]) => {
      try {
        const response = await fetch(path);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const blob = await response.blob();
        const img = new Image();
        img.src = URL.createObjectURL(blob);
        results[varName] = img;
        window[varName] = img;
        console.info(`Loaded sprite: ${varName} (${path})`);
      } catch (e) {
        console.warn(`Failed to load sprite ${varName} (${path}):`, e);
        results[varName] = null;
        window[varName] = null;
      }
    });
    await Promise.all(promises);
    return results;
  }
};
