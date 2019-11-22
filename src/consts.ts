let PROJECT_STAGE = "production"; // todo debug
// let PROJECT_STAGE = "development"; // todo debug

let USE_GZIP_COMPRESSION = true;

// when worker will be left less RAM than this threshold he'll commit suicide
let HEAP_SIZE_LEFT_THRESHOLD = (totalHeap: number) => {
  let percentage = PROJECT_STAGE === "production" ? 10 / 100 : 10 / 100;
  return totalHeap * percentage;
}; // percentages

// interval of which each worker will check his memory in use
let CHECK_HEAP_INTERVAL = PROJECT_STAGE === "production" ? 1000 : 1000; // milliseconds

export {
  PROJECT_STAGE,
  USE_GZIP_COMPRESSION,
  HEAP_SIZE_LEFT_THRESHOLD,
  CHECK_HEAP_INTERVAL
};
