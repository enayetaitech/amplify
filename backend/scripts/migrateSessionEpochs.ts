import mongoose from "mongoose";
import dotenv from "dotenv";
import config from "../config/index";
import { SessionModel } from "../model/SessionModel";
import { toTimestampStrict } from "../processors/session/sessionTimeConflictChecker";

dotenv.config();

async function run() {
  const mongoUri = config.database_url;
  if (!mongoUri) {
    console.error("MONGO_URI not set");
    process.exit(1);
  }

  await mongoose.connect(mongoUri);

  const cursor = SessionModel.find({}).cursor();
  let processed = 0;
  for await (const doc of cursor) {
    try {
      const tz = doc.timeZone;
      const startAtEpoch = toTimestampStrict(doc.date, doc.startTime, tz);
      const endAtEpoch = startAtEpoch + doc.duration * 60_000;
      if (doc.startAtEpoch !== startAtEpoch || doc.endAtEpoch !== endAtEpoch) {
        await SessionModel.updateOne(
          { _id: doc._id },
          { $set: { startAtEpoch, endAtEpoch } }
        );
      }
      processed++;
      if (processed % 100 === 0) console.log(`Processed ${processed} sessions`);
    } catch (e) {
      console.error(
        `Failed to backfill for session ${doc._id}:`,
        (e as Error).message
      );
    }
  }

  // Ensure index exists
  await SessionModel.collection.createIndex({
    projectId: 1,
    startAtEpoch: 1,
    endAtEpoch: 1,
  });

  await mongoose.disconnect();
 
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
