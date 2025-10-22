import mongoose, { Types } from "mongoose";
import ProjectModel from "../model/ProjectModel";
import { AuditLogModel } from "../model/AuditLog";

export async function transferProjectsAtomic(params: {
  actorId: string;
  fromAdminId: string;
  toAdminId: string;
}) {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const fromId = new Types.ObjectId(params.fromAdminId);
    const toId = new Types.ObjectId(params.toAdminId);
    const result = await ProjectModel.updateMany(
      { createdBy: fromId },
      { $set: { createdBy: toId } },
      { session }
    );
    const modified = result.modifiedCount || 0;

    await AuditLogModel.create([
      {
        actorId: new Types.ObjectId(params.actorId),
        action: "externalAdmin.transferProjects",
        targetType: "User",
        targetId: fromId,
        metadata: { toAdminId: String(toId), modified },
      },
    ]);
    await session.commitTransaction();
    return { modified };
  } catch (e) {
    await session.abortTransaction();
    throw e;
  } finally {
    session.endSession();
  }
}
