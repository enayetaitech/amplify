// components/ProfileDetailsCard.tsx

import { Badge } from "components/ui/badge";
import { Button } from "components/ui/button";
import { Card, CardContent } from "components/ui/card";
import { Mail, Phone, Building2, Home, Landmark, MapPin, Globe2, DollarSign, UserCircle2 } from "lucide-react";
import Image from "next/image";
import React from "react";

type BillingInfo = {
  address: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
};

export function ProfileDetailsCard({
  firstName,
  lastName,
  role,
  email,
  credits,
  phoneNumber,
  companyName,
  billingInfo,
  onEdit,
  onChangePassword,
  onDelete,
  isDeleting,
}: {
  firstName: string;
  lastName: string;
  role: string;
  email: string;
  credits: string;
  phoneNumber: string;
  companyName: string;
  billingInfo?: BillingInfo | null;
  onEdit: () => void;
  onChangePassword: () => void;
  onDelete: () => void;
  isDeleting: boolean;
}) {
  return (
    <Card className="max-w-4xl mx-auto mt-10 p-0 shadow-xl rounded-2xl border-custom-gray-7">
      <CardContent className="p-8">
        {/* Header */}
        <div className="flex items-center gap-6 mb-8">
          <div>
            <Image
              src="/placeholder-image.png"
              alt="User"
              width={80}
              height={80}
              className="rounded-full border-4 border-custom-light-blue-1 shadow-md"
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-2xl font-bold text-custom-dark-blue-1 truncate">
                {firstName} {lastName}
              </span>
              <Badge className="bg-custom-light-blue-1 text-white text-xs px-3 py-1 rounded-xl uppercase tracking-wider">
                {role}
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-custom-gray-3 mt-1">
              <Mail size={18} /> <span className="truncate">{email}</span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <DollarSign size={18} className="text-custom-orange-2" />
              <span className="font-semibold text-custom-orange-2">
                {credits}
              </span>
              <span className="text-xs text-custom-gray-5">Credits</span>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-custom-gray-7 mb-6" />

        {/* Personal Details */}
        <h2 className="text-lg font-semibold text-custom-light-blue-1 mb-3 tracking-wide">
          Personal Details
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <DetailItem
            icon={<UserCircle2 size={20} className="text-custom-gray-3" />}
            label="First Name"
            value={firstName}
          />
          <DetailItem
            icon={<UserCircle2 size={20} className="text-custom-gray-3" />}
            label="Last Name"
            value={lastName}
          />
          <DetailItem
            icon={<Phone size={20} className="text-custom-gray-3" />}
            label="Phone"
            value={phoneNumber}
          />
          <DetailItem
            icon={<Building2 size={20} className="text-custom-gray-3" />}
            label="Company"
            value={companyName}
          />
        </div>

        {/* Address Details */}
        {billingInfo && (
          <>
            <h2 className="text-lg font-semibold text-custom-light-blue-1 mb-3 tracking-wide">
              Address
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DetailItem
                icon={<Home size={20} className="text-custom-gray-3" />}
                label="Address"
                value={billingInfo.address}
              />
              <DetailItem
                icon={<Landmark size={20} className="text-custom-gray-3" />}
                label="City"
                value={billingInfo.city}
              />
              <DetailItem
                icon={<MapPin size={20} className="text-custom-gray-3" />}
                label="State"
                value={billingInfo.state}
              />
              <DetailItem
                icon={<Mail size={20} className="text-custom-gray-3" />}
                label="Postal"
                value={billingInfo.postalCode}
              />
              <DetailItem
                icon={<Globe2 size={20} className="text-custom-gray-3" />}
                label="Country"
                value={billingInfo.country}
              />
            </div>
          </>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col md:flex-row gap-4 justify-center mt-10">
          <Button variant="teal" className="w-full md:w-44" onClick={onEdit}>
            Edit Profile
          </Button>
          <Button
            variant="dark-blue"
            className="w-full md:w-44"
            onClick={onChangePassword}
          >
            Change Password
          </Button>
          <Button
            variant="orange"
            className="w-full md:w-44"
            onClick={onDelete}
            disabled={isDeleting}
          >
            {isDeleting ? "Deleting…" : "Delete Account"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Helper for label/value pair
function DetailItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2 bg-custom-gray-2 rounded-xl px-3 py-2">
      {icon}
      <span className="text-custom-gray-5 font-medium w-28">{label}:</span>
      <span className="truncate">{value}</span>
    </div>
  );
}
