"use client";

import React from "react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import Logo from "components/shared/LogoComponent";
import FooterComponent from "components/shared/FooterComponent";
import { Button } from "components/ui/button";
import { Form } from "components/ui/form";
import TextInputField from "components/createAccount/TextInputField";
import PasswordField from "components/createAccount/PasswordField";
import { zodResolver } from "@hookform/resolvers/zod";
import { FieldErrors, useForm } from "react-hook-form";
import {
  ObserverJoinValues,
  observerJoinSchema,
} from "schemas/observerJoinSchema";
import { useResolveObserverSession } from "hooks/useResolveObserverSession";
import { useEnqueueWaitingRoom } from "hooks/useEnqueueWaitingRoom";
import { safeLocalSet } from "utils/storage";

const ObserverJoinMeeting: React.FC = () => {
  const router = useRouter();
  const { sessionId: idParam } = useParams() as { sessionId: string };

  const form = useForm<ObserverJoinValues>({
    resolver: zodResolver(observerJoinSchema),
    defaultValues: { firstName: "", lastName: "", email: "", passcode: "" },
  });

  const { resolve } = useResolveObserverSession();
  const { enqueue } = useEnqueueWaitingRoom();

  const handleErrors = (errors: FieldErrors<ObserverJoinValues>) => {
    Object.values(errors).forEach((fieldError) => {
      if (fieldError?.message) {
        toast.error(fieldError.message as string);
      }
    });
  };

  const onSubmit = form.handleSubmit(async (values) => {
    const firstNameTrimmed = values.firstName.trim();
    const lastNameTrimmed = values.lastName.trim();
    const nameTrimmed = `${firstNameTrimmed} ${lastNameTrimmed}`;
    const emailNormalized = values.email.trim().toLowerCase();
    try {
      const { latest, projectId } = await resolve(idParam);

      const res = await enqueue({
        sessionId: latest.sessionId,
        firstName: firstNameTrimmed,
        lastName: lastNameTrimmed,
        email: emailNormalized,
        role: "Observer",
        passcode: values.passcode,
        device:
          typeof navigator !== "undefined" ? navigator.userAgent : undefined,
      });

      // Persist for socket handshakes (waiting room and meeting page)
      safeLocalSet("liveSessionUser", {
        firstName: firstNameTrimmed,
        lastName: lastNameTrimmed,
        name: nameTrimmed,
        email: emailNormalized,
        role: "Observer",
      });
      
      // Store projectId for project-level chat and tracking
      safeLocalSet("observerProjectId", projectId);

      const action = res?.data?.action as "waiting_room" | "stream" | undefined;
      if (action === "stream") {
        router.push(`/meeting/${latest.sessionId}?role=Observer`);
      } else {
        router.push(`/waiting-room/observer/${latest.sessionId}`);
      }
    } catch (err) {
      const anyErr = err as unknown;
      const msg =
        anyErr && typeof anyErr === "object" && "message" in anyErr
          ? (anyErr as { message: string }).message
          : "Failed to join";
      toast.error(msg);
    }
  }, handleErrors);

  return (
    <div className="bg-white">
      {/* Content */}
      <div className="lg:flex lg:justify-center lg:items-center">
        {/* Left: Form */}
        <div className="flex-1 pb-5 lg:pb-0">
          <div className="border-0">
            <div className="text-center pt-2 lg:pt-5">
              <div className=" bg-white flex justify-center items-center pb-5">
                <Logo />
              </div>
              <h2 className="text-2xl lg:text-3xl font-bold">JOIN MEETING</h2>
            </div>
            {/* mobile image */}
            <div className="lg:hidden flex justify-center items-center py-2 px-4">
              <Image
                src="/join-meeting.png"
                alt="Join meeting"
                width={360}
                height={240}
                className="h-auto w-full"
                priority
              />
            </div>
            <div className="mt-2 lg:mt-6">
              <Form {...form}>
                <form onSubmit={onSubmit} className="lg:px-24 px-4 space-y-4">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <TextInputField
                      control={form.control}
                      name="firstName"
                      label="First Name"
                      placeholder="First Name"
                      disabled={form.formState.isSubmitting}
                    />
                    <TextInputField
                      control={form.control}
                      name="lastName"
                      label="Last Name"
                      placeholder="Last Name"
                      disabled={form.formState.isSubmitting}
                    />
                  </div>
                  <TextInputField
                    control={form.control}
                    name="email"
                    label="Email"
                    placeholder="Enter your email"
                    type="email"
                    disabled={form.formState.isSubmitting}
                  />
                  <PasswordField
                    control={form.control}
                    name="passcode"
                    label="Passcode"
                    placeholder="Enter passcode"
                    disabled={form.formState.isSubmitting}
                  />
                  <Button
                    type="submit"
                    className="w-full bg-orange-500 hover:bg-orange-600"
                    disabled={form.formState.isSubmitting}
                  >
                    {form.formState.isSubmitting ? "Joining…" : "Join Meeting"}
                  </Button>
                </form>
              </Form>
            </div>
          </div>
        </div>

        {/* Right: Image */}
        <div className="flex-1  min-h-screen hidden lg:flex items-center justify-center">
          <div className="px-6 mt-5">
            <Image
              src="/join-meeting.png"
              alt="Join meeting"
              width={640}
              height={480}
              className="h-auto w-full max-w-xl"
              priority
            />
          </div>
        </div>
      </div>

      <FooterComponent />
    </div>
  );
};

export default ObserverJoinMeeting;
