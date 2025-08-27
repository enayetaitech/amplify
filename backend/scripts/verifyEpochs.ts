import mongoose from "mongoose";
import dotenv from "dotenv";
import { SessionModel } from "../model/SessionModel";

dotenv.config();

async function run() {
  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error("MONGO_URI not set");
    process.exit(1);
  }

  await mongoose.connect(mongoUri);
  console.log("Connected to MongoDB");

  const total = await SessionModel.countDocuments({});
  const missing = await SessionModel.countDocuments({
    $or: [
      { startAtEpoch: { $exists: false } },
      { endAtEpoch: { $exists: false } },
    ],
  });
  const nullish = await SessionModel.countDocuments({
    $or: [{ startAtEpoch: null }, { endAtEpoch: null }],
  });
  const badOrder = await SessionModel.countDocuments({
    $expr: { $gte: ["$startAtEpoch", "$endAtEpoch"] },
  });

  console.log(`Total sessions: ${total}`);
  console.log(`Missing epoch fields: ${missing}`);
  console.log(`Null epoch fields: ${nullish}`);
  console.log(`startAtEpoch >= endAtEpoch: ${badOrder}`);

  if (missing > 0 || nullish > 0) {
    const sample = await SessionModel.find({
      $or: [
        { startAtEpoch: { $exists: false } },
        { endAtEpoch: { $exists: false } },
        { startAtEpoch: null },
        { endAtEpoch: null },
      ],
    })
      .select(
        "title projectId date startTime duration timeZone startAtEpoch endAtEpoch"
      )
      .limit(5)
      .lean();
    console.log("Sample missing/null sessions:", sample);
  }

  await mongoose.disconnect();
  console.log("Verification done.");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
