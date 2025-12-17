function generateMap(width, height, fillProb = 0.18){
  const map = Array.from({length: height}, () => Array.from({length: width}, () => 0));
  for(let y=0;y<height;y++) for(let x=0;x<width;x++){
    if(Math.random() < fillProb) map[y][x] = 1;
  }
  // make borders walls
  for(let x=0;x<width;x++){ map[0][x] = 1; map[height-1][x] = 1; }
  for(let y=0;y<height;y++){ map[y][0] = 1; map[y][width-1] = 1; }
  return map;
}