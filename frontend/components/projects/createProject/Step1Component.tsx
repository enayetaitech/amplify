"use client";

import React from "react";
import { Step1Props } from "@shared/interface/CreateProjectInterface";
import { ServiceTierCard } from "./step1Component/ServiceTierCard";

export interface TierConfig {
  key: "Signature" | "Concierge";
  title: string;
  features: React.ReactNode;
  hasAddOns: boolean;
}

const tiers: TierConfig[] = [
  {
    key: "Signature",
    title: "Tier 1: Signature Platform Access",
    hasAddOns: false,
    features: (
      <ul className="list-disc pl-6 text-sm space-y-1">
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
    ),
  },
  {
    key: "Concierge",
    title: "Tier 2: Concierge Platform Access",
    hasAddOns: true,
    features: (
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
    ),
  },
];

const Step1: React.FC<Step1Props> = ({ formData, updateFormData }) => {
  // Update the selected service tier
   const handleServiceSelect = (tier: "Signature" | "Concierge") => {
    updateFormData({ service: tier });
  };

  // Update the first date of streaming when the date input changes
   const handleDateChange = (date: string) => {
    updateFormData({ firstDateOfStreaming: date });
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
      {tiers.map((tier) => (
        <ServiceTierCard
          key={tier.key}
          tier={tier}
          selected={formData.service as "Signature" | "Concierge" | undefined}
          onSelect={handleServiceSelect}
          firstDate={formData.firstDateOfStreaming}
          onDateChange={handleDateChange}
          addOns={formData.addOns}
          onAddOnToggle={handleAddOnToggle}
        />
      ))}
    </div>
  );
};

export default Step1;
