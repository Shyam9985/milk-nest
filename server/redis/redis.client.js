const { createClient } = require("redis");
const { logBlock } = require("../utils/log.utils");

const redisClient = createClient({
    url: process.env.REDIS_URL || "redis://localhost:6379"
});

redisClient.on("error", (error) => {
    logBlock('[redis] error:', error);
});

redisClient.on("connect", () => {
    logBlock('[redis] connect:', "Redis client connecting...");
});

redisClient.on("ready", () => {
    logBlock('[redis] ready:', "Redis client ready");
});

redisClient.on("end", () => {
    logBlock('[redis] end:', "Redis client disconnected");
});

const connectRedis = async () => {
    if (!redisClient.isOpen) {
        await redisClient.connect();
    }
};

const destroyRedis = async () => {
    logBlock('[redis] destroy:', "Destroying Redis client...");
    if (redisClient.isOpen) {
        await redisClient.quit();
    }
};

module.exports = {
    redisClient,
    connectRedis,
    destroyRedis
};