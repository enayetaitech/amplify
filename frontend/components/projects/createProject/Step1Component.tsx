"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "components/ui/card";
import { Input } from "components/ui/input";
import { Step1Props } from "@shared/interface/CreateProjectInterface";

const optionalAddOnServices = [
  "Top-Notch Recruiting",
  "Insight-Driven Moderation and Project Design",
  "Multi-Language Services",
  "Asynchronous Activities (Pretasks, Bulletin Boards, etc.)",
];

const Step1: React.FC<Step1Props> = ({ formData, updateFormData }) => {
  // Update the selected service tier
  const handleCardSelect = (tier: "Signature" | "Concierge") => {
    updateFormData({ service: tier });
  };

  // Update the first date of streaming when the date input changes
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const dateValue = e.target.value;
    updateFormData({ firstDateOfStreaming: dateValue });
  };

  // Toggle add-on checkbox selection
  const handleCheckboxChange = (service: string) => {
    let addOns = formData.addOns || [];
    if (addOns.includes(service)) {
      addOns = addOns.filter((s) => s !== service);
    } else {
      addOns = [...addOns, service];
    }
    updateFormData({ addOns });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:space-x-4 space-y-4 md:space-y-0">
        {/* Tier 1 Card */}
        <Card
          className={`flex-1 p-4 cursor-pointer border ${
            formData.service === "Signature"
              ? "border-blue-500"
              : "border-gray-300"
          }`}
          onClick={() => handleCardSelect("Signature")}
        >
          <CardHeader>
            <CardTitle>Signature Platform Access (Tier 1)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-custom-dark-blue-1 mt-2">
              DIY Streaming using Amplify’s Virtual Backroom
            </p>
            <ul className="list-disc pl-6 mt-2 text-sm">
              <li>Amplify’s Virtual Backroom Platform Access</li>
              <li>Live Streaming</li>
              <li>Participant Chat</li>
              <li>Whiteboards</li>
              <li>Breakout Rooms</li>
              <li>Polling</li>
              <li>Observation Room</li>
              <li>
                Live observation with real-time observer and moderator chat
              </li>
              <li>Session Deliverables:</li>
              <ul className="list-circle pl-6">
                <li>Audio Recording</li>
                <li>Video Recording</li>
                <li>AI Transcripts</li>
                <li>Chat Transcripts</li>
                <li>Whiteboard & Poll Results</li>
              </ul>
            </ul>
          </CardContent>
        </Card>

        {/* Tier 2 Card */}
        <Card
          className={`flex-1 p-4 cursor-pointer border ${
            formData.service === "Concierge"
              ? "border-blue-500"
              : "border-gray-300"
          }`}
          onClick={() => handleCardSelect("Concierge")}
        >
          <CardHeader>
            <CardTitle>Concierge Platform Access (Tier 2)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-custom-dark-blue-1 mt-2">
              Stream your sessions with the support of Amplify’s first-class team
            </p>
            <ul className="list-disc pl-6 mt-2 text-sm">
              <li>Everything in the Signature Platform Access, plus:</li>
              <ul className="list-disc pl-6">
                <li>Amplify’s Hosting and Project Support</li>
                <li>Hosted Session Check-In:</li>
                <ul className="list-disc pl-6">
                  <li>Test video and sound with each participant</li>
                  <li>
                    Recommend lighting and camera adjustments as needed
                  </li>
                  <li>Verify IDs upon request</li>
                  <li>
                    Verify pre-session requirements (HW, items, etc.)
                  </li>
                  <li>
                    Follow-up with missing participants by phone, email, or
                    text
                  </li>
                </ul>
                <li>Continuous Meeting Monitoring:</li>
                <ul className="list-disc pl-6">
                  <li>
                    Tech Host monitors all sessions to help troubleshoot any
                    participant challenges and provide moderator and observer
                    support
                  </li>
                </ul>
                <li>Amplify Project Support:</li>
                <ul className="list-disc pl-6">
                  <li>
                    Amplify’s project team is available to help with all project
                    setup and to provide backend platform assistance and support
                  </li>
                </ul>
              </ul>
              <li>Access to Optional Add-On Services:</li>
              <ul className="list-disc pl-6">
                {optionalAddOnServices.map((service) => (
                  <li key={service}>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        value={service}
                        checked={formData.addOns?.includes(service) || false}
                        onChange={() => handleCheckboxChange(service)}
                        className="mr-2 cursor-pointer"
                        disabled={formData.service !== "Concierge"}
                      />
                      {service}
                    </label>
                  </li>
                ))}
              </ul>
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Date Picker for First Date of Streaming */}
      <div className="mt-4">
        <label className="block text-sm font-medium text-gray-700">
          First Date of Streaming
        </label>
        <Input
          type="date"
          value={formData.firstDateOfStreaming || ""}
          onChange={handleDateChange}
          className="mt-1 w-full"
        />
      </div>
    </div>
  );
};

export default Step1;
