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
import { zodResolver } from "@hookform/resolvers/zod";
import { FieldErrors, useForm } from "react-hook-form";
import {
  ParticipantJoinValues,
  participantJoinSchema,
} from "schemas/participantJoinSchema";
import { useResolveParticipantSession } from "hooks/useResolveParticipantSession";
import { useEnqueueWaitingRoom } from "hooks/useEnqueueWaitingRoom";

export default function ParticipantJoinMeeting() {
  const router = useRouter();
  const { sessionId: idParam } = useParams() as { sessionId: string };

  const { resolve } = useResolveParticipantSession();
  const { enqueue } = useEnqueueWaitingRoom();

  const form = useForm<ParticipantJoinValues>({
    resolver: zodResolver(participantJoinSchema),
    defaultValues: { firstName: "", lastName: "", email: "" },
    mode: "onSubmit",
  });

  const handleErrors = (errors: FieldErrors<ParticipantJoinValues>) => {
    Object.values(errors).forEach((fieldError) => {
      if (fieldError?.message) {
        toast.error(fieldError.message as string);
      }
    });
  };

  const onSubmit = form.handleSubmit(async (values) => {
    const nameTrimmed = `${values.firstName.trim()} ${values.lastName.trim()}`;
    const emailNormalized = values.email.trim().toLowerCase();

    try {
      const { sessionId } = await resolve(idParam);

      await enqueue({
        sessionId,
        name: nameTrimmed,
        email: emailNormalized,
        role: "Participant",
        device:
          typeof navigator !== "undefined" ? navigator.userAgent : undefined,
      });

      localStorage.setItem(
        "liveSessionUser",
        JSON.stringify({
          name: nameTrimmed,
          email: emailNormalized,
          role: "Participant",
        })
      );

      router.push(`/waiting-room/participant/${sessionId}`);
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
}
