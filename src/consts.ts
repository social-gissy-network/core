let PROJECT_STAGE = "production"; // todo debug
// let PROJECT_STAGE = "development"; // todo debug

let USE_GZIP_COMPRESSION = true;

// when worker will be left less RAM than this threshold he'll commit suicide
let MAX_HEAP_CAPACITY = 0.7; // percentages

// interval of which each worker will check his memory in use
let CHECK_HEAP_INTERVAL = PROJECT_STAGE === "production" ? 1000 : 1000; // milliseconds

// whether to use cache
let USE_CACHE = true;

// logger
const winston = require('winston'); // for transports.Console
const { createLogger, format, transports } = require('winston');
const { combine, timestamp, label, prettyPrint } = format;
const logger = createLogger({
  format: combine(
      timestamp(),
      prettyPrint()
  ),
  transports: [
    new transports.Console(),
    new winston.transports.File({filename: `logs/${(new Date()).toISOString().split("T")[0]}.log`})
  ]
});

let LOG = (level: string, message: string, location: string, additionalData?: object) => {
  let logObject = {
    level: level,
    message: message,
    location: location,
    additionalData
  };

  if (additionalData) {
    logObject.additionalData = additionalData;
  }
  else {
    delete logObject.additionalData;
  }

  logger.log(logObject);
};

export {
  PROJECT_STAGE,
  USE_GZIP_COMPRESSION,
  MAX_HEAP_CAPACITY,
  CHECK_HEAP_INTERVAL,
  USE_CACHE,
  LOG
};
