import mongoose from "mongoose";
import dotenv from "dotenv";
import config from "../config/index";
import { SessionModel } from "../model/SessionModel";

dotenv.config();

async function run() {
  const mongoUri = config.database_url;
  if (!mongoUri) {
    console.error("MONGO_URI not set");
    process.exit(1);
  }

  await mongoose.connect(mongoUri);

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
  }

  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
