import { SessionDeliverableModel } from "../model/SessionDeliverableModel";
import { deleteFromS3 } from "../utils/uploadToS3";

export async function purgeExpiredDeliverables(): Promise<{
  deleted: number;
  s3Errors: number;
}> {
  const now = new Date();
  // find soft-deleted deliverables whose purgeAfterAt has passed
  const toPurge = await SessionDeliverableModel.find({
    deletedAt: { $ne: null },
    purgeAfterAt: { $lte: now },
  }).lean();

  let deleted = 0;
  let s3Errors = 0;

  for (const d of toPurge) {
    try {
      await deleteFromS3(d.storageKey);
    } catch {
      s3Errors += 1;
      // continue; still try to remove DB row so it doesn't block
    }
    await SessionDeliverableModel.deleteOne({ _id: d._id });
    deleted += 1;
  }

  return { deleted, s3Errors };
}
