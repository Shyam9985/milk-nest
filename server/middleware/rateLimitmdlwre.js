const datefns = require("date-fns");
const { sendErrorResponse } = require("../utils/response.utils");
const RESPONSE_STATUS = require("../utils/standard.messages");

//rate limit map
const rateLimitMap = new Map();
// rate limie object structure token bucket
// {capacity : 0 ,currentTokens : 0 , refillRate : 0 , lastRefillTimestamp : 0}

// generate request key for rate limiting with the combination of user + method + route
function generateReteLimitKey(user, req) {
  const method = req.method;
  const ip = req.ip;
  const url = req.route?.path
    ? req?.baseUrl + req?.route?.path
    : req.originalUrl || req.url;
  // console.log("generateReteLimitKey", user, ip, method, url);

  const primary = user?.user_id > 0 ? user?.user_id : ip;
  return primary + ":" + method + ":" + url;
}

//rate limit check middleware
const checkRateLimit = (refillRate, capacity) => (req, res, next) => {
  // generate a unique key for the request based on user, method, and route
  const key = generateReteLimitKey(req.user, req);

  // console.log("checkRateLimit:", key);
  const now = datefns.getTime(new Date());

  if (!rateLimitMap.has(key)) {
    // add new rate limit key with current timestamp with bucket size of 60
    rateLimitMap.set(key, {
      currentTokens: capacity - 1,
      capacity: capacity,
      refillRate: refillRate,
      lastRefillTimestamp: now,
    });
  } else {
    const rateLimitData = rateLimitMap.get(key);

    // calculate the time elapsed since the last refill.
    const elapsedMs = datefns.differenceInMilliseconds(now, rateLimitData.lastRefillTimestamp);
    
    // refill the tokens based on the elapsed time and refill rate.
    rateLimitData.currentTokens = Math.min(rateLimitData.capacity, rateLimitData.currentTokens + (elapsedMs / 1000) * rateLimitData.refillRate);
    
    // update the last refill timestamp
    rateLimitData.lastRefillTimestamp = now;
    
    //check if the key has current tokens available to consume.
    if (rateLimitData.currentTokens >= 1) {
      rateLimitData.currentTokens--;
      // update the count of the key in the map
      rateLimitMap.set(key, rateLimitData);
    } else {
      // seconds until the bucket holds one whole token again
      const waitSeconds = Math.ceil(
        (1 - rateLimitData.currentTokens) / rateLimitData.refillRate,
      );
      // '45 seconds' / '2 minutes 58 seconds' / '15 minutes'
      const waitText = datefns.formatDuration(
        datefns.intervalToDuration({ start: 0, end: waitSeconds * 1000 }),
      );

      // standard header so the client can retry automatically
      res.setHeader("Retry-After", waitSeconds);

      return sendErrorResponse(
        req,
        res,
        `Too many requests. Please try again in ${waitText}.`,
        RESPONSE_STATUS.TOOMANY_REQUESTS,
        { function: "checkRateLimit" },
      );
    }
  }
  next();
};

// delete the rate limit keys that are older than one hour to prevent memory leak
setInterval(() => {
  const now = datefns.getTime(new Date());
  for (const [key, rateLimitData] of rateLimitMap.entries()) {
    const elapsedSeconds = datefns.differenceInMinutes(
      now,
      rateLimitData.lastRefillTimestamp,
    );
    if (elapsedSeconds > 60) {
      rateLimitMap.delete(key);
    }
  }
}, 3600000); // run every hour

exports.checkRateLimit = checkRateLimit;
