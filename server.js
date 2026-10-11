require("dotenv").config();
const dbConfig = require('./server/config/db.config');
const { connectRedis, destroyRedis } = require("./server/redis/redis.client");
const { logBlock } = require("./server/utils/log.utils");

// Global unhandled exception handling
process.on("uncaughtException", (error) => {
  logBlock("[server] error:", "Unhandled Exception : ", error);
  logBlock("[server] error:", "Unhandled exception occurred. shutting down the server...");
  process.exit(1);
});

const server = require("./node");
const { closeMetrics } = require("./server/middleware/requestLoggerMdlwre");

// redis client connection 
connectRedis();

const port = process.env.PORT || 4901;

const serverVar = server.app.listen(port, "localhost", () => {
  logBlock("[server] listening:", `Server is up and listening on ${port} to the requests...`);
});

// closes the http server, then the metrics log file and every db pool. mysql2/promise pools have no
// close() — the method is end(), and it returns a Promise, not a callback
const shutdown = (exitCode) => {
  serverVar.close(async () => {
    logBlock("[server] shutdown:", "HTTP server closed");

    try {
      await Promise.allSettled([
        closeMetrics(),
        dbConfig.pool.end(),
        dbConfig.operatorPool.end(),
        dbConfig.viewerPool.end(),
        destroyRedis()
      ]);
      logBlock("[server] shutdown:", "Metrics log and database connections closed");
    } catch (error) {
      logBlock("[server] error:", "Error occurred while shutting down:", error);
    } finally {
      process.exit(exitCode);
    }
  });
};

process.on("SIGINT", () => {
  logBlock("[server] shutdown:", "SIGINT received");
  shutdown(0);
});

process.on("SIGTERM", () => {
  logBlock("[server] shutdown:", "SIGTERM received");
  shutdown(0);
});

// Global rejected promise handling
process.on("unhandledRejection", (error) => {
  logBlock("[server] error:", "Unhandled Rejection : ", error);
  logBlock("[server] error:", "Unhandled rejection occurred. shutting down the server...");
  shutdown(1);
});
