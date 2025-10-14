import { Request, Response, NextFunction } from "express";
import ErrorHandler from "../../utils/ErrorHandler";
import { sendResponse } from "../../utils/responseHelpers";
import * as reportsService from "../../processors/reports/reportsService";
import { z } from "zod";
import {
  zProjectParams,
  zProjectSessionsQuery,
  zSessionParams,
  zObserverParams,
  zObserverSummaryQuery,
} from "../../schemas/reports";

const zParams = zProjectParams;

const zSessionParamsLocal = zSessionParams;
const zObserverParamsLocal = zObserverParams;

export const getProjectSummaryHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const parsed = zParams.safeParse(req.params);
    if (!parsed.success) return next(new ErrorHandler("Invalid params", 400));
    const { projectId } = parsed.data;

    const summary = await reportsService.getProjectSummary(projectId);
    sendResponse(res, summary, "Project summary fetched", 200);
  } catch (e: any) {
    next(new ErrorHandler(e?.message || "internal_error", 500));
  }
};

const zQuery = zProjectSessionsQuery;

export const getProjectSessionsHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const p = zParams.safeParse(req.params);
    if (!p.success) return next(new ErrorHandler("Invalid params", 400));
    const q = zQuery.safeParse(req.query);
    if (!q.success) return next(new ErrorHandler("Invalid query", 400));

    const { projectId } = p.data;
    const { page = "1", limit = "10", sortBy, sortDir, search } = q.data;

    const pageNum = Math.max(Number(page || 1), 1);
    const limitNum = Math.max(Number(limit || 10), 1);

    const result = await reportsService.getProjectSessions(
      projectId,
      pageNum,
      limitNum,
      sortBy,
      sortDir,
      search
    );

    sendResponse(res, result.items, "Sessions fetched", 200, result.meta);
  } catch (e: any) {
    next(new ErrorHandler(e?.message || "internal_error", 500));
  }
};

export const getSessionParticipantsHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const p = zSessionParamsLocal.safeParse(req.params);
    if (!p.success) return next(new ErrorHandler("Invalid params", 400));

    const page = Math.max(Number(req.query.page || 1), 1);
    const limit = Math.max(Number(req.query.limit || 10), 1);

    const data = await reportsService.getSessionParticipants(
      p.data.sessionId,
      page,
      limit
    );

    sendResponse(res, data.items, "Participants fetched", 200, data.meta);
  } catch (e: any) {
    next(new ErrorHandler(e?.message || "internal_error", 500));
  }
};

export const getSessionObserversHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const p = zSessionParamsLocal.safeParse(req.params);
    if (!p.success) return next(new ErrorHandler("Invalid params", 400));

    const page = Math.max(Number(req.query.page || 1), 1);
    const limit = Math.max(Number(req.query.limit || 10), 1);

    const data = await reportsService.getSessionObservers(
      p.data.sessionId,
      page,
      limit
    );

    sendResponse(res, data.items, "Observers fetched", 200, data.meta);
  } catch (e: any) {
    next(new ErrorHandler(e?.message || "internal_error", 500));
  }
};

export const getObserverSummaryHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const p = zObserverParamsLocal.safeParse(req.params);
    if (!p.success) return next(new ErrorHandler("Invalid params", 400));

    const projectId = String(req.query.projectId || "");
    if (!projectId) return next(new ErrorHandler("projectId required", 400));

    const data = await reportsService.getObserverSummary(
      p.data.observerId,
      projectId
    );

    sendResponse(res, data, "Observer summary fetched", 200);
  } catch (e: any) {
    next(new ErrorHandler(e?.message || "internal_error", 500));
  }
};

export const getProjectParticipantsHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const p = zParams.safeParse(req.params);
    if (!p.success) return next(new ErrorHandler("Invalid params", 400));

    const page = Math.max(Number(req.query.page || 1), 1);
    const limit = Math.max(Number(req.query.limit || 100), 1);

    const data = await reportsService.getProjectParticipants(
      p.data.projectId,
      page,
      limit
    );
    sendResponse(
      res,
      data.items,
      "Project participants fetched",
      200,
      data.meta
    );
  } catch (e: any) {
    next(new ErrorHandler(e?.message || "internal_error", 500));
  }
};

export const getProjectObserversHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const p = zParams.safeParse(req.params);
    if (!p.success) return next(new ErrorHandler("Invalid params", 400));

    const page = Math.max(Number(req.query.page || 1), 1);
    const limit = Math.max(Number(req.query.limit || 100), 1);

    const data = await reportsService.getProjectObservers(
      p.data.projectId,
      page,
      limit
    );
    sendResponse(res, data.items, "Project observers fetched", 200, data.meta);
  } catch (e: any) {
    next(new ErrorHandler(e?.message || "internal_error", 500));
  }
};
