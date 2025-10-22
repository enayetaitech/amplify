import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { sendResponse } from "../utils/responseHelpers";
import ErrorHandler from "../utils/ErrorHandler";
import User from "../model/UserModel";
import { Roles } from "../constants/roles";
import {
  CreateAdminUserSchema,
  EditAdminUserSchema,
  ListUsersQuerySchema,
  StatusUpdateSchema,
  ResendInviteSchema,
  ExternalAdminsQuerySchema,
  TransferProjectsSchema,
} from "../schemas/admin";
import {
  canCreateRole,
  createUserAndInvite,
  resendInvite,
  updateStatus,
} from "../services/userAdminService";
import { forceLogoutUserSockets } from "../socket";
import { transferProjectsAtomic } from "../services/projectTransferService";
import { Types } from "mongoose";
import ProjectModel from "../model/ProjectModel";
import { SessionModel } from "../model/SessionModel";

export const adminCreateUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const actor = (req as any).user as { userId: string; role: string };
    const parsed = CreateAdminUserSchema.safeParse(req.body);
    if (!parsed.success) {
      return next(new ErrorHandler("Invalid payload", 400));
    }
    const data = parsed.data;
    if (!canCreateRole(actor.role, data.role)) {
      return next(new ErrorHandler("Forbidden: cannot create this role", 403));
    }
    const user = await createUserAndInvite({ actorId: actor.userId, ...data });
    sendResponse(
      res,
      { userId: user._id },
      "User created and invite sent",
      201
    );
  } catch (e) {
    next(e);
  }
};

export const adminListUsers = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const parsed = ListUsersQuerySchema.safeParse(req.query);
    if (!parsed.success) return next(new ErrorHandler("Invalid query", 400));
    const { q, companyName, page, pageSize } = parsed.data;
    const and: any[] = [];
    if (q) {
      const rx = new RegExp(q, "i");
      and.push({ $or: [{ firstName: rx }, { lastName: rx }, { email: rx }] });
    }
    if (companyName) {
      const rxCompany = new RegExp(companyName, "i");
      and.push({ companyName: rxCompany });
    }
    const filter = and.length ? { $and: and } : {};
    const cursor = User.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize);
    const [items, total] = await Promise.all([
      cursor.lean(),
      User.countDocuments(filter),
    ]);
    sendResponse(res, { items, total, page, pageSize }, "Users listed", 200);
  } catch (e) {
    next(e);
  }
};

export const adminEditUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const actor = (req as any).user as { userId: string; role: string };
    const id = String(req.params.id);
    const parsed = EditAdminUserSchema.safeParse(req.body);
    if (!parsed.success) return next(new ErrorHandler("Invalid payload", 400));
    const user = await User.findById(id);
    if (!user) return next(new ErrorHandler("User not found", 404));
    // Only SuperAdmin/AmplifyAdmin editing operational roles and admin cannot edit core fields of Admins
    if (user.role === Roles.Admin && actor.role !== Roles.SuperAdmin) {
      return next(
        new ErrorHandler("Forbidden: cannot edit external admin profile", 403)
      );
    }
    await User.updateOne({ _id: id }, { $set: parsed.data });
    sendResponse(res, null, "User updated", 200);
  } catch (e) {
    next(e);
  }
};

export const adminUpdateStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const actor = (req as any).user as { userId: string };
    const id = String(req.params.id);
    const parsed = StatusUpdateSchema.safeParse(req.body);
    if (!parsed.success) return next(new ErrorHandler("Invalid payload", 400));
    await updateStatus(actor.userId, id, parsed.data.status);
    if (parsed.data.status === "Inactive") {
      try {
        forceLogoutUserSockets(id);
      } catch {}
    }
    sendResponse(res, null, "Status updated", 200);
  } catch (e) {
    next(e);
  }
};

export const adminResendInvite = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const actor = (req as any).user as { userId: string };
    const parsed = ResendInviteSchema.safeParse(req.body);
    if (!parsed.success) return next(new ErrorHandler("Invalid payload", 400));
    await resendInvite(actor.userId, parsed.data.userId);
    sendResponse(res, null, "Invite resent", 200);
  } catch (e) {
    next(e);
  }
};

export const listExternalAdmins = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const parsed = ExternalAdminsQuerySchema.safeParse(req.query);
    if (!parsed.success) return next(new ErrorHandler("Invalid query", 400));
    const { q, companyName, page, pageSize } = parsed.data;
    const and: any[] = [{ role: Roles.Admin }];
    if (q) {
      const rx = new RegExp(q, "i");
      and.push({ $or: [{ firstName: rx }, { lastName: rx }, { email: rx }] });
    }
    if (companyName) {
      const rxCompany = new RegExp(companyName, "i");
      and.push({ companyName: rxCompany });
    }
    const filter = { $and: and } as any;
    const cursor = User.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize);
    const [items, total] = await Promise.all([
      cursor.lean(),
      User.countDocuments(filter),
    ]);
    sendResponse(
      res,
      { items, total, page, pageSize },
      "External admins listed",
      200
    );
  } catch (e) {
    next(e);
  }
};

export const transferExternalAdminProjects = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const actor = (req as any).user as { userId: string; role: string };
    if (actor.role !== Roles.SuperAdmin)
      return next(new ErrorHandler("Forbidden", 403));
    const parsed = TransferProjectsSchema.safeParse(req.body);
    if (!parsed.success) return next(new ErrorHandler("Invalid payload", 400));
    const { modified } = await transferProjectsAtomic({
      actorId: actor.userId,
      fromAdminId: parsed.data.fromAdminId,
      toAdminId: parsed.data.toAdminId,
    });
    sendResponse(res, { modified }, "Projects transferred", 200);
  } catch (e) {
    next(e);
  }
};

export const deleteExternalAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const actor = (req as any).user as { userId: string; role: string };
    if (actor.role !== Roles.SuperAdmin)
      return next(new ErrorHandler("Forbidden", 403));
    const id = String(req.params.id);
    // Ensure no projects owned
    const owned = await (
      await import("../model/ProjectModel")
    ).default.countDocuments({ createdBy: new Types.ObjectId(id) });
    if (owned > 0)
      return next(new ErrorHandler("Transfer projects before delete", 400));
    await User.deleteOne({ _id: id });
    sendResponse(res, null, "External admin deleted", 200);
  } catch (e) {
    next(e);
  }
};

export const adminListProjects = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const q = (req.query.q as string) || "";
    const companyName = (req.query.companyName as string) || "";
    const status = (req.query.status as string) || "";
    const page = Math.max(1, Number(req.query.page || 1));
    const pageSize = Math.max(
      1,
      Math.min(100, Number(req.query.pageSize || 20))
    );
    const and: any[] = [];
    if (q) {
      const rx = new RegExp(q, "i");
      and.push({
        $or: [{ name: rx }, { internalProjectName: rx }, { description: rx }],
      });
    }
    if (companyName) {
      const rxCompany = new RegExp(companyName, "i");
      // join through createdBy? For now, filter by description/name (no company field on Project)
      and.push({ description: rxCompany });
    }
    if (status) {
      and.push({ status });
    }
    const filter = and.length ? { $and: and } : {};
    const cursor = ProjectModel.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .populate("createdBy")
      .lean();
    const [items, total] = await Promise.all([
      cursor,
      ProjectModel.countDocuments(filter),
    ]);
    sendResponse(res, { items, total, page, pageSize }, "Projects listed", 200);
  } catch (e) {
    next(e);
  }
};

export const adminListSessions = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const q = (req.query.q as string) || "";
    const page = Math.max(1, Number(req.query.page || 1));
    const pageSize = Math.max(
      1,
      Math.min(100, Number(req.query.pageSize || 20))
    );
    const and: any[] = [];
    if (q) {
      const rx = new RegExp(q, "i");
      and.push({ $or: [{ title: rx }] });
    }
    const filter = and.length ? { $and: and } : {};
    const cursor = SessionModel.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .populate("projectId")
      .lean();
    const [items, total] = await Promise.all([
      cursor,
      SessionModel.countDocuments(filter),
    ]);
    sendResponse(res, { items, total, page, pageSize }, "Sessions listed", 200);
  } catch (e) {
    next(e);
  }
};
