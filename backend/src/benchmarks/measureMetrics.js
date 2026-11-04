import config from "../config/env.js";
import mongoose from "mongoose";
import { client, connectRedis } from "../config/redis.js";
import Room from "../models/Room.js";
import User from "../models/User.js";
import { performance } from "perf_hooks";
import crypto from "crypto";

const TEST_ROOM_ID = `benchmark-heavy-${crypto.randomUUID()}`;
const STROKE_COUNT = 2000; // 2,000 vector paths = ~50,000 coordinates
const BATCH_ROUNDS = 100; // 100 separate rounds
const SAMPLES_PER_ROUND = 20; // 20 queries per round = 2000 total sample queries
const TOTAL_SAMPLES = BATCH_ROUNDS * SAMPLES_PER_ROUND;

// Generate 2,000 realistic drawing strokes
const generateMockElements = (count) => {
  const elements = [];
  for (let i = 0; i < count; i++) {
    const points = [];
    for (let p = 0; p < 25; p++) {
      points.push({
        x: Math.round(Math.random() * 3000),
        y: Math.round(Math.random() * 3000),
      });
    }
    elements.push({
      id: crypto.randomUUID(),
      tool: "pencil",
      points,
      color: "#3b82f6",
      strokeWidth: 3,
    });
  }
  return elements;
};

// Calculate percentiles (p50, p95, p99)
const getPercentile = (arr, p) => {
  const sorted = [...arr].sort((a, b) => a - b);
  const index = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, index)].toFixed(2);
};

const runHeavyBenchmark = async () => {
  console.log(
    "==================================================================",
  );
  console.log(
    "     CREWBOARD HIGH-LOAD EMPIRICAL BENCHMARK (2,000 STROKES)      ",
  );
  console.log(
    "==================================================================\n",
  );

  await mongoose.connect(config.MONGODB_URI);
  await connectRedis();

  const user =
    (await User.findOne()) ||
    (await User.create({ name: "Benchmark Runner", isGuest: true }));

  console.log(
    `🌱 Seeding heavy test room with ${STROKE_COUNT} vector strokes (~50,000 coordinates)...`,
  );
  const mockElements = generateMockElements(STROKE_COUNT);

  // Seed MongoDB Atlas
  await Room.create({
    roomId: TEST_ROOM_ID,
    name: "Heavy Benchmark Board",
    owner: user._id,
    members: [user._id],
    isPrivate: false,
    elements: mockElements,
  });

  // Seed Redis RAM Cache
  await client.set(
    `room:${TEST_ROOM_ID}:elements`,
    JSON.stringify(mockElements),
    {
      EX: 3600,
    },
  );

  console.log("✅ Seeding complete.\n");

  // ----------------------------------------------------
  // 1. Measure Exact Document Payload Sizes
  // ----------------------------------------------------
  console.log("📦 1. MEASURING DOCUMENT PAYLOAD OPTIMIZATION...");
  const fullRoom = await Room.findOne({ roomId: TEST_ROOM_ID }).select(
    "elements",
  );
  const prunedRoom = await Room.findOne({ roomId: TEST_ROOM_ID }).select(
    "-elements",
  );

  const fullSizeBytes = Buffer.byteLength(JSON.stringify(fullRoom), "utf8");
  const prunedSizeBytes = Buffer.byteLength(JSON.stringify(prunedRoom), "utf8");

  const fullSizeKB = (fullSizeBytes / 1024).toFixed(2);
  const prunedSizeKB = (prunedSizeBytes / 1024).toFixed(2);
  const payloadReductionPercent = (
    ((fullSizeBytes - prunedSizeBytes) / fullSizeBytes) *
    100
  ).toFixed(2);

  console.log(
    `   - Full Room Payload (2,000 strokes) : ${fullSizeKB} KB (${fullSizeBytes.toLocaleString()} bytes)`,
  );
  console.log(
    `   - Pruned Room Payload (.select)     : ${prunedSizeKB} KB (${prunedSizeBytes.toLocaleString()} bytes)`,
  );
  console.log(
    `   🚀 Payload Size Reduction           : ${payloadReductionPercent}%\n`,
  );

  // ----------------------------------------------------
  // 2. Multi-Round Latency Measurement
  // ----------------------------------------------------
  console.log(
    `⏱️  2. EXECUTING ${BATCH_ROUNDS} ROUNDS × ${SAMPLES_PER_ROUND} SAMPLES (${TOTAL_SAMPLES} TOTAL MEASUREMENTS)...`,
  );
  const mongoLatencies = [];
  const redisLatencies = [];

  for (let round = 1; round <= BATCH_ROUNDS; round++) {
    process.stdout.write(`   ▶ Round ${round}/${BATCH_ROUNDS}: `);

    for (let i = 1; i <= SAMPLES_PER_ROUND; i++) {
      // Test MongoDB Atlas
      const t0 = performance.now();
      await Room.findOne({ roomId: TEST_ROOM_ID }).select("elements");
      const mongoTime = performance.now() - t0;
      mongoLatencies.push(mongoTime);

      // Test Redis RAM Cache
      const t1 = performance.now();
      await client.get(`room:${TEST_ROOM_ID}:elements`);
      const redisTime = performance.now() - t1;
      redisLatencies.push(redisTime);
    }

    const roundAvgMongo = (
      mongoLatencies.slice(-SAMPLES_PER_ROUND).reduce((a, b) => a + b, 0) /
      SAMPLES_PER_ROUND
    ).toFixed(1);
    const roundAvgRedis = (
      redisLatencies.slice(-SAMPLES_PER_ROUND).reduce((a, b) => a + b, 0) /
      SAMPLES_PER_ROUND
    ).toFixed(1);
    console.log(
      `Done. (Avg: Mongo ${roundAvgMongo}ms | Redis ${roundAvgRedis}ms)`,
    );
  }
  console.log("\n");

  // Statistical calculations across all 2000 samples
  const avgMongo = (
    mongoLatencies.reduce((a, b) => a + b, 0) / TOTAL_SAMPLES
  ).toFixed(2);
  const avgRedis = (
    redisLatencies.reduce((a, b) => a + b, 0) / TOTAL_SAMPLES
  ).toFixed(2);
  const minMongo = Math.min(...mongoLatencies).toFixed(2);
  const minRedis = Math.min(...redisLatencies).toFixed(2);
  const maxMongo = Math.max(...mongoLatencies).toFixed(2);
  const maxRedis = Math.max(...redisLatencies).toFixed(2);

  const p50Mongo = getPercentile(mongoLatencies, 50);
  const p95Mongo = getPercentile(mongoLatencies, 95);
  const p99Mongo = getPercentile(mongoLatencies, 99);

  const p50Redis = getPercentile(redisLatencies, 50);
  const p95Redis = getPercentile(redisLatencies, 95);
  const p99Redis = getPercentile(redisLatencies, 99);

  const speedupFactor = (avgMongo / avgRedis).toFixed(1);
  const latencyReductionPercent = (
    ((avgMongo - avgRedis) / avgMongo) *
    100
  ).toFixed(2);

  console.log(
    "==================================================================",
  );
  console.log(
    "             STATISTICAL BENCHMARK RESULTS (100 SAMPLES)          ",
  );
  console.log(
    "==================================================================",
  );
  console.table([
    {
      DataStore: "MongoDB Atlas (Cloud TLS)",
      "Avg (Mean)": `${avgMongo} ms`,
      "p50 (Median)": `${p50Mongo} ms`,
      p95: `${p95Mongo} ms`,
      p99: `${p99Mongo} ms`,
      Min: `${minMongo} ms`,
      Max: `${maxMongo} ms`,
    },
    {
      DataStore: "Redis RAM Cache (In-Memory)",
      "Avg (Mean)": `${avgRedis} ms`,
      "p50 (Median)": `${p50Redis} ms`,
      p95: `${p95Redis} ms`,
      p99: `${p99Redis} ms`,
      Min: `${minRedis} ms`,
      Max: `${maxRedis} ms`,
    },
  ]);

  console.log(`⚡ Speedup Factor            : ${speedupFactor}x faster`);
  console.log(`📉 Latency Reduction         : ${latencyReductionPercent}%`);
  console.log(`📦 Payload Bandwidth Saved   : ${payloadReductionPercent}%`);
  console.log(
    "==================================================================\n",
  );

  console.log("🧹 Cleaning up temporary test room...");
  await Room.deleteOne({ roomId: TEST_ROOM_ID });
  await client.del(`room:${TEST_ROOM_ID}:elements`);
  await mongoose.disconnect();
  await client.disconnect();
  console.log("🏁 Heavy benchmark complete.\n");
};

runHeavyBenchmark().catch((err) => {
  console.error("Benchmark failed:", err);
  process.exit(1);
});
