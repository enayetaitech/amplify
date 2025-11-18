import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

async function main() {
  const dbUrl =
    process.env.MONGO_URI || process.env.DATABASE_URL || process.env.MONGOURL;
  if (!dbUrl) {
    console.error("MONGO_URI (or DATABASE_URL) not set in environment");
    process.exit(1);
  }
  // Connect using the connection string only; modern Mongo drivers reject `keepAlive` in the URI options
  await mongoose.connect(String(dbUrl));

  const LiveSession = require("../model/LiveSessionModel").LiveSessionModel;
  const Project = require("../model/ProjectModel").default;

  console.log("Computing cumulative minutes per project from live sessions...");

  // Aggregate rounded minutes per project
  const agg = await LiveSession.aggregate([
    // join to sessions to get projectId
    {
      $lookup: {
        from: "sessions",
        localField: "sessionId",
        foreignField: "_id",
        as: "session",
      },
    },
    { $addFields: { session: { $arrayElemAt: ["$session", 0] } } },
    { $match: { "session.projectId": { $exists: true, $ne: null } } },
    {
      $addFields: {
        durationMs: {
          $cond: [
            {
              $and: [
                { $ifNull: ["$endTime", false] },
                { $ifNull: ["$startTime", false] },
              ],
            },
            { $subtract: ["$endTime", "$startTime"] },
            null,
          ],
        },
      },
    },
    {
      $addFields: {
        minutesRounded: {
          $cond: [
            { $ifNull: ["$durationMs", false] },
            { $ceil: { $divide: ["$durationMs", 60000] } },
            0,
          ],
        },
      },
    },
    {
      $group: {
        _id: "$session.projectId",
        totalMinutes: { $sum: "$minutesRounded" },
      },
    },
  ]).allowDiskUse(true);

  console.log(`Found ${agg.length} projects with live session minutes`);

  for (const row of agg) {
    try {
      const pid = row._id;
      const totalMinutes = row.totalMinutes || 0;
      await Project.updateOne(
        { _id: pid },
        { $set: { cumulativeMinutes: totalMinutes } }
      ).exec();
      console.log(`Project ${pid}: set cumulativeMinutes = ${totalMinutes}`);
    } catch (e) {
      console.error("Failed updating project", e);
    }
  }

  console.log("Backfill complete");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
