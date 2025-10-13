import { z } from "zod";

export const zProjectParams = z.object({ projectId: z.string().min(1) });

export const zProjectSessionsQuery = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  sortBy: z.string().optional(),
  sortDir: z.enum(["asc", "desc"]).optional(),
  search: z.string().optional(),
});

export const zSessionParams = z.object({ sessionId: z.string().min(1) });

export const zObserverParams = z.object({ observerId: z.string().min(1) });

export const zObserverSummaryQuery = z.object({ projectId: z.string().min(1) });
