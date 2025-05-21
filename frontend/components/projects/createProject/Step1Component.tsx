"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "components/ui/card";
import { Input } from "components/ui/input";
import { Step1Props } from "@shared/interface/CreateProjectInterface";
import { optionalAddOnServices } from "constant";



const Step1: React.FC<Step1Props> = ({ formData, updateFormData }) => {
  // Update the selected service tier
   const handleServiceSelect = (tier: "Signature" | "Concierge") => {
    updateFormData({ service: tier });
  };

  // Update the first date of streaming when the date input changes
   const handleDateChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    updateFormData({ firstDateOfStreaming: e.target.value });
  };

  // Toggle add-on checkbox selection
  const handleAddOnToggle = (service: string) => {
    const addOns = formData.addOns?.includes(service)
      ? formData.addOns.filter((s) => s !== service)
      : [...(formData.addOns || []), service];
    updateFormData({ addOns });
  };

   return (
    <div className="flex flex-col md:flex-row md:gap-6 gap-4 items-stretch">
      {/** Tier 1: Signature **/}
      <Card
        onClick={() => handleServiceSelect("Signature")}
        className={`relative flex flex-col flex-1 cursor-pointer p-4 border transition-shadow
          ${
            formData.service === "Signature"
              ? "border-custom-teal shadow-md"
              : "border-gray-200 hover:shadow-sm"
          }`}
      >
        <input
          type="radio"
          name="service"
          value="Signature"
          checked={formData.service === "Signature"}
          onChange={() => handleServiceSelect("Signature")}
          className="absolute top-4 left-4 h-4 w-4 cursor-pointer accent-custom-teal"
        />

        <CardHeader className="pt-2 pl-8">
          <CardTitle className="text-custom-teal">
            Tier 1: Signature Platform Access
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col flex-1 justify-between">
          <h1>DIY Streaming using Amplify&apos;s Virtual Backroom</h1>
          <ul className="list-disc pl-6 text-sm space-y-1 ">
            <li>Amplify’s Virtual Backroom Platform Access</li>
            <li>Live Streaming</li>
            <li>Participant Chat</li>
            <li>Whiteboards</li>
            <li>Breakout Rooms</li>
            <li>Polling</li>
            <li>Observation Room</li>
            <li>Live observer & moderator chat</li>
            <li>
              Session Deliverables:
              <ul className="list-circle pl-6">
                <li>Audio Recording</li>
                <li>Video Recording</li>
                <li>AI Transcripts</li>
                <li>Chat Transcripts</li>
                <li>Whiteboard & Poll Results</li>
              </ul>
            </li>
          </ul>

          {/** Date picker pinned to bottom */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700">
              First Date of Streaming
            </label>
            <Input
              type="date"
              disabled={formData.service !== "Signature"}
              value={formData.service === "Signature"
                  ? formData.firstDateOfStreaming
                  : ""}
              onChange={  formData.service === "Signature" ? handleDateChange : undefined}
              className="mt-1 w-full"
            />
          </div>
        </CardContent>
      </Card>

      {/** Tier 2: Concierge **/}
      <Card
        onClick={() => handleServiceSelect("Concierge")}
        className={`relative flex flex-col flex-1 cursor-pointer p-4 border transition-shadow
          ${
            formData.service === "Concierge"
              ? "border-custom-teal shadow-md"
              : "border-gray-200 hover:shadow-sm"
          }`}
      >
        <input
          type="radio"
          name="service"
          value="Concierge"
          checked={formData.service === "Concierge"}
          onChange={() => handleServiceSelect("Concierge")}
          className="absolute top-4 left-4 h-4 w-4 cursor-pointer accent-custom-teal"
        />

        <CardHeader className="pt-2 pl-8">
          <CardTitle className="text-custom-teal">
            Tier 2: Concierge Platform Access
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col flex-1">
          <div className="flex-1 space-y-4">
            <h1>DIY Streaming using Amplify&apos;s Virtual Backroom</h1>
            <ul className="list-disc pl-6 text-sm space-y-1">
              <li>Everything in Tier 1, plus:</li>
              <ul className="list-disc pl-6">
                <li>Amplify’s Hosting & Project Support</li>
                <li>
                  Hosted Session Check-In:
                  <ul className="list-disc pl-6">
                    <li>Test video & sound</li>
                    <li>Lighting & camera recommendations</li>
                    <li>ID & pre-session verifications</li>
                    <li>Follow-up on no-shows</li>
                  </ul>
                </li>
                <li>Continuous Meeting Monitoring</li>
                <li>Amplify Project Support Team</li>
              </ul>
            </ul>

            <div className="mt-4">
              <p className="font-medium text-sm">Optional Add-On Services:</p>
              <ul className="list-none pl-0 mt-2 space-y-1">
                {optionalAddOnServices.map((svc) => (
                  <li key={svc}>
                    <label className="inline-flex items-center text-sm">
                      <input
                        type="checkbox"
                        checked={formData.addOns?.includes(svc) || false}
                        onChange={() => handleAddOnToggle(svc)}
                        disabled={formData.service !== "Concierge"}
                        className="mr-2 h-4 w-4 cursor-pointer accent-custom-teal"
                      />
                      {svc}
                    </label>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/** Date picker pinned to bottom */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700">
              First Date of Streaming
            </label>
            <Input
              type="date"
              value={formData.service === "Concierge" ? formData.firstDateOfStreaming : "" }
              disabled={formData.service !== "Concierge"}
              onChange={formData.service === "Concierge" ? handleDateChange : undefined}
              className="mt-1 w-full"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Step1;
