const projectStage = "production";
// const projectStage = "development";

// when worker will be left less RAM than this threshold he'll commit suicide
let HEAP_SIZE_LEFT_THRESHOLD = (totalHeap: number) => {
  let percentage = projectStage === "production" ? 3 / 100 : 3 / 100;
  return totalHeap * percentage;
}; // percentages

// interval of which each worker will check his memory in use
let CHECK_HEAP_INTERVAL = projectStage === "production" ? 1000 : 1000; // milliseconds

export { HEAP_SIZE_LEFT_THRESHOLD, CHECK_HEAP_INTERVAL };
