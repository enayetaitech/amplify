"use client";

import React from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "components/ui/input";
import { Button } from "components/ui/button";
import { useParams, useRouter } from "next/navigation";
import api from "lib/api";
import axios from "axios";
import { toast } from "sonner";
import { ApiResponse } from "@shared/interface/ApiResponseInterface";

const observerJoinSchema = z.object({
  name: z.string().nonempty("Name is required"),
  email: z.string().email("Invalid email address"),
  passcode: z.string().min(1, "Passcode is required"),
});
type ObserverJoinData = z.infer<typeof observerJoinSchema>;
type LatestSessionRes = { sessionId: string; status: "ongoing" | "upcoming" };


const ObserverJoinMeeting: React.FC = () => {
  const router = useRouter();
  const { sessionId: idParam } = useParams() as { sessionId: string };

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ObserverJoinData>({
    resolver: zodResolver(observerJoinSchema),
  });

  async function tryGetSession(projectOrSessionId: string) {
    try {
      const res = await api.get<{
        data: { _id: string; projectId: string | { _id: string } };
      }>(`/api/v1/sessions/${projectOrSessionId}`);
      return {
        sessionId: res.data.data._id,
        projectId: res.data.data.projectId,
      };
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 404) {
        return null;
      }
      throw err;
    }
  }

  async function resolveProjectToSession(projectId: string) {
    const res = await api.get<ApiResponse<LatestSessionRes>>(`/api/v1/sessions/project/${projectId}/latest`, {
      params: { role: "Observer" },
    });
    return res.data.data;
  }

  const onSubmit = async (data: ObserverJoinData) => {
    try {
      // Determine if param is a session or a project
      const maybeSession = await tryGetSession(idParam);
      let projectId: string;
      if (maybeSession) {
        const pid = maybeSession.projectId;
        projectId = typeof pid === "string" ? pid : pid._id;
      } else {
        projectId = idParam;
      }

      // Resolve latest for observer semantics
      let resolved: LatestSessionRes;

      try {
        resolved = await resolveProjectToSession(projectId);
      } catch  {
          toast.error("No current or upcoming session for this project.");
        return;
      }

      // Enqueue; server decides waiting room vs stream by ongoing flag
      const enqueueRes = await api.post(`/api/v1/waiting-room/enqueue`, {
        sessionId: resolved.sessionId,
        name: data.name,
        email: data.email,
        role: "Observer",
        passcode: data.passcode,
      });

      const action = enqueueRes.data?.data?.action as
        | "waiting_room"
        | "stream"
        | undefined;
      if (action === "stream") {
        // Navigate to streaming room page (existing meeting route)
        router.push(`/meeting/${resolved.sessionId}?role=Observer`);
      } else {
        // Default to waiting room
        router.push(`/waiting-room/observer/${resolved.sessionId}`);
      }
    } catch (err) {
      const msg = axios.isAxiosError(err) ? err.message : "Failed to join";
      toast.error(msg);
    }
  };


  return (
    <div className="max-w-md mx-auto mt-12 p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-semibold mb-4">Join as Observer</h2>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium mb-1">
            Name
          </label>
          <Input id="name" {...register("name")} placeholder="Your full name" />
          {errors.name && (
            <p className="text-red-600 text-sm mt-1">{errors.name.message}</p>
          )}
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-1">
            Email
          </label>
          <Input
            id="email"
            type="email"
            {...register("email")}
            placeholder="you@example.com"
          />
          {errors.email && (
            <p className="text-red-600 text-sm mt-1">{errors.email.message}</p>
          )}
        </div>
        <div>
          <label htmlFor="passcode" className="block text-sm font-medium mb-1">
            Passcode
          </label>
          <Input
            id="passcode"
            type="password"
            {...register("passcode")}
            placeholder="Project passcode"
          />
          {errors.passcode && (
            <p className="text-red-600 text-sm mt-1">
              {errors.passcode.message}
            </p>
          )}
        </div>
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Joining…" : "Join Meeting"}
        </Button>
      </form>
    </div>
  );
};

export default ObserverJoinMeeting;
