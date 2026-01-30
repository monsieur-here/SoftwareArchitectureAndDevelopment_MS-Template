const { createLogger, format, transports } = require("winston");
const { ElasticsearchTransport } = require("winston-elasticsearch");
const { getCorrelationId } = require("./correlationId"); // Function to retrieve the correlation ID

// Define custom log levels
const customLevels = {
  levels: {
    fatal: 0,
    error: 1,
    warn: 2,
    info: 3,
    debug: 4,
  },
};
// Elasticsearch transport configuration
const esTransport = (appName) => {
  let transporter = {
    level: "info", // Minimum log level to send to Elasticsearch
    clientOpts: {
      node: "https://my-deployment-b6715a.es.us-central1.gcp.cloud.es.io:9243",
      auth: {
        username: "elastic",
        password: "bQyZp4mL0CYig7OC3MFkvQkY",
      },
    },
    maxRetries: 5,
    requestTimeout: 60000,
    tls: { rejectUnauthorized: false },
    indexPrefix: "sms-logs", // Logs will be stored in indices like "nodejs-logs-YYYY.MM.DD"
    transformer: (logData) => ({
      ...logData,
      timestamp: logData.timestamp || new Date().toISOString(),
      correlationId: getCorrelationId() || "N/A",
      appName, // Add additional metadata if needed
    }),
  };
  return transporter;
};

// Create the logger
const createDynamicLogger = (appName) => {
  const logger = createLogger({
    levels: customLevels.levels,
    format: format.combine(
      format.timestamp(),
      format.printf(({ level, message, timestamp }) => {
        // Add correlation ID to the log entry
        return JSON.stringify({
          timestamp,
          level,
          message,
          correlationId: getCorrelationId() || "N/A",
        });
      }),
    ),
    transports: [
      new transports.Console(), // Log to console
      new ElasticsearchTransport(esTransport(appName)), // Log to Elasticsearch
    ],
  });
  return logger;
};
let authServiceLogger = createDynamicLogger("authService");
let studentServiceLogger = createDynamicLogger("studentService");
let enrollementServiceLogger = createDynamicLogger("enrollmentService");
let courseServiceLogger = createDynamicLogger("courseService");

// Add this after your logger creation
authServiceLogger.transports.find(t => t instanceof ElasticsearchTransport)
  .on('warning', (err) => {
    console.error('--- ELASTICSEARCH WARNING ---', err);
  })
  .on('error', (err) => {
    console.error('--- ELASTICSEARCH CRITICAL ERROR ---', err);
  });

module.exports = {
  authServiceLogger,
  studentServiceLogger,
  enrollementServiceLogger,
  courseServiceLogger,
};
