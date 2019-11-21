const projectStage = "production";
// const projectStage = "development";

// we'll use 250MB limit for the heroku server we currently use, as it have a total of 512 RAM
let MAX_HEAP_SIZE = projectStage === "production" ? 250 : 1000; // MB

// interval of which each worker will check his memory in use
let CHECK_HEAP_INTERVAL = projectStage === "production" ? 1000 : 1000; // milliseconds

export { MAX_HEAP_SIZE, CHECK_HEAP_INTERVAL };
