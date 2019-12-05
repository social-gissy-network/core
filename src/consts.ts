let PROJECT_STAGE = "production"; // todo debug
// let PROJECT_STAGE = "development"; // todo debug

let USE_GZIP_COMPRESSION = true;

// when worker will be left less RAM than this threshold he'll commit suicide
let MAX_HEAP_CAPACITY = 0.7; // percentages

// interval of which each worker will check his memory in use
let CHECK_HEAP_INTERVAL = PROJECT_STAGE === "production" ? 1000 : 1000; // milliseconds

export {
  PROJECT_STAGE,
  USE_GZIP_COMPRESSION,
  MAX_HEAP_CAPACITY,
  CHECK_HEAP_INTERVAL
};
