require("dotenv").config();
const dbConfig = require('./server/config/db.config');

// Global unhandled exception handling
process.on("uncaughtException", (error) => {
  console.log("Unhandled Exception : ", error);
  console.log("Unhandled exception occurred. shutting down the server...");
  process.exit(1);
});

const server = require("./node");
const dbutils = require("./server/utils/db.utils");
const dbconfig = require("./server/config/db.config");

const port = process.env.PORT || 4901;

const serverVar = server.app.listen(port, "localhost", () => {
  console.log(`Server is up and listening on ${port} to the requests...`);
});

// closes the http server, then every db pool. mysql2/promise pools have no
// close() — the method is end(), and it returns a Promise, not a callback
const shutdown = (exitCode) => {
  serverVar.close(async () => {
    console.log("HTTP server closed");

    try {
      await Promise.allSettled([
        dbConfig.pool.end(),
        dbConfig.operatorPool.end(),
        dbConfig.viewerPool.end(),
      ]);
      console.log("Database connections closed");
    } finally {
      process.exit(exitCode);
    }
  });
};

process.on("SIGINT", () => {
  console.log("SIGINT received");
  shutdown(0);
});

process.on("SIGTERM", () => {
  console.log("SIGTERM received");
  shutdown(0);
});

// Global rejected promise handling
process.on("unhandledRejection", (error) => {
  console.log("Unhandled Rejection : ", error);
  console.log("Unhandled rejection occurred. shutting down the server...");
  shutdown(1);
});
