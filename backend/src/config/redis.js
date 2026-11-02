import { createClient } from "redis";
import config from "./env.js";

const client = createClient({
  url: config.REDIS_URL,
});

client.on("error", (error) => console.log("Redis Error: ", error));

const connectRedis = async () => {
  try {
    await client.connect();
    console.log("Redis connected successfully...");
  } catch (error) {
    console.log("Redis connection error: ", error.message);
    process.exit(1);
  }
};

export { client, connectRedis };
