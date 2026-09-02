const { rateLimit, ipKeyGenerator } = require("express-rate-limit");
const { RedisStore } = require("rate-limit-redis");
const { redis } = require("../config/redis");

const paymentRateLimiter = rateLimit({
  windowMs: 60 * 1000,

  limit: 5,

  standardHeaders: true,
  legacyHeaders: false,

  keyGenerator: (req) => {
    if (req.user?.id) {
      return `payment:user:${req.user.id}`;
    }

    return `payment:ip:${ipKeyGenerator(req.ip)}`;
  },

  store: new RedisStore({
    sendCommand: (...args) => redis.sendCommand(args),
  }),

  message: {
    success: false,
    message: "Too many payment requests. Please wait a minute and try again.",
  },
});

module.exports = paymentRateLimiter;
