// components/MyProfilePage.tsx
"use client";

import React from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Button } from "components/ui/button";
import PasswordModalComponent from "components/PasswordModalComponent";
import ConfirmationModalComponent from "components/ConfirmationModalComponent";
import { useGlobalContext } from "context/GlobalContext";
import { RiPencilFill } from "react-icons/ri";
import { IoTrashSharp } from "react-icons/io5";
import { MdLockReset } from "react-icons/md";
import { useDeleteUser } from "hooks/useDeleteUser";
import { useProfileModals } from "hooks/useProfileModals";
import { ProfileField } from "components/profile/ProfileField";

const Page: React.FC = () => {
  const { user } = useGlobalContext();
  const { id } = useParams<{ id: string }>();

  const deleteUserMutation = useDeleteUser();
  const {
    showPasswordModal,
    setShowPasswordModal,
    showDeleteModal,
    setShowDeleteModal,
  } = useProfileModals();

  // Derive displayable strings once, so JSX stays clean:
  const firstName      = user?.firstName?.toUpperCase() ?? "Loading...";
  const lastName       = user?.lastName?.toUpperCase()  ?? "Loading...";
  const role           = user?.role?.toUpperCase()      ?? "Loading...";
  const email          = user?.email                    ?? "Loading...";
  const credits        = user?.credits?.toString()      ?? "0";
  const phoneNumber    = user?.phoneNumber               ?? "Loading...";
  const companyName    = user?.companyName               ?? "Loading...";
  const billingInfo    = user?.billingInfo;
  const billingAddress = billingInfo?.address            ?? "Loading...";
  const billingCity    = billingInfo?.city               ?? "Loading...";
  const billingState   = billingInfo?.state              ?? "Loading...";
  const billingPostal  = billingInfo?.postalCode         ?? "Loading...";
  const billingCountry = billingInfo?.country            ?? "Loading...";

  return (
    <>
      {/* Desktop View */}
      <div className="hidden md:flex my_profile_main_section_shadow bg-[#fafafb] bg-opacity-90 h-full min-h-screen flex-col justify-center items-center relative">
        <div className="bg-white h-16 w-full px-10 flex justify-between items-center pt-2">
          <p className="text-2xl font-bold text-custom-teal">My Profile</p>
        </div>

        <div className="flex-grow w-full px-10 pt-14">
          <div className="flex gap-4 items-center">
            <Image
              src="/placeholder-image.png"
              alt="user image"
              height={50}
              width={70}
              className="rounded-full"
            />
            <div className="flex-grow">
              <h1 className="text-3xl font-semibold text-custom-dark-blue-1">
                {firstName}
              </h1>
              <p>{role}</p>
            </div>
          </div>

          <h1 className="text-2xl font-semibold text-custom-dark-blue-1 pt-7">
            Personal Details
          </h1>
          <div className="space-y-2 pt-7">
            <div className="flex justify-start items-center gap-10">
              <ProfileField label="First Name"       value={firstName} upperCase />
              <ProfileField label="Last Name"        value={lastName}  upperCase />
            </div>
            <div className="flex justify-start items-center gap-10">
              <ProfileField label="Email"            value={email} />
              <ProfileField label="Remaining Credits" value={credits} />
            </div>
            <div className="flex justify-start items-center gap-10">
              <ProfileField label="Phone Number"     value={phoneNumber} />
              <ProfileField label="Company Name"     value={companyName} />
            </div>

            {billingInfo && (
              <div className="space-y-2 pt-2">
                <div className="flex justify-start items-center gap-10">
                  <ProfileField label="Address"     value={billingAddress} />
                  <ProfileField label="City"        value={billingCity} />
                </div>

                <div className="flex justify-start items-center gap-10">
                  <ProfileField label="State"       value={billingState} />
                  <ProfileField label="Postal Code" value={billingPostal} />
                </div>
                <div className="flex justify-start items-center gap-10">
                  <ProfileField label="Country"     value={billingCountry} />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Desktop action buttons at bottom */}
        <div className="flex gap-4 justify-end items-center pb-10 w-full px-10">
          <Link href={`/edit-profile/${id}`}>
            <Button
              type="button"
              variant="teal"
              className="rounded-xl w-[200px] text-center py-6 shadow-[0px_3px_6px_#2976a54d]"
            >
              <RiPencilFill /> Edit Profile
            </Button>
          </Link>
          <Button
            type="button"
            variant="dark-blue"
            onClick={() => setShowPasswordModal(true)}
            className="rounded-xl w-[200px] text-center py-6 shadow-[0px_3px_6px_#2976a54d]"
          >
            <MdLockReset /> Change Password
          </Button>
          <Button
            type="button"
            variant="orange"
            onClick={() => setShowDeleteModal(true)}
            disabled={deleteUserMutation.isPending}
            className="rounded-xl w-[200px] text-center py-6 shadow-[0px_3px_6px_#FF66004D]"
          >
            {deleteUserMutation.isPending
              ? "Deleting…"
              : <>
                  <IoTrashSharp /> Delete Account
                </>
            }
          </Button>
        </div>
      </div>

      {/* Mobile View */}
      <div className="md:hidden my_profile_main_section_shadow bg-[#fafafb] bg-opacity-90 h-full min-h-screen flex flex-col justify-start items-center p-5 relative">
        <div className="w-full flex justify-between items-center absolute top-0 left-0 px-5 pt-5">
          <p className="text-xl font-bold text-custom-teal text-center flex-grow">
            My Profile
          </p>
          <div>
            <Link href={`/edit-profile/${id}`}>
              <Button type="button" variant="teal">
                <RiPencilFill />
              </Button>
            </Link>
          </div>
        </div>

        <div className="flex-grow w-full pt-16">
          <div className="flex flex-col justify-start items-center gap-4">
            <Image
              src="/placeholder-image.png"
              alt="user image"
              height={60}
              width={70}
              className="rounded-full"
            />
            <h1 className="text-3xl font-semibold text-center text-custom-teal">
              {firstName}
            </h1>
            <p className="text-sm text-center text-gray-400">
              {role}
            </p>
          </div>

          <h1 className="text-xl font-semibold text-custom-dark-blue-1 pt-10">
            Personal Details
          </h1>
          <div className="space-y-2 pt-3">
            <ProfileField label="First Name"       value={firstName} upperCase />
            <ProfileField label="Last Name"        value={lastName}  upperCase />
            <ProfileField label="Email"            value={email} />
            <ProfileField label="Remaining Credits" value={credits} />
            <ProfileField label="Phone Number"     value={phoneNumber} />
            <ProfileField label="Company Name"     value={companyName} />

            {billingInfo && (
              <div className="space-y-2 pt-3">
                <ProfileField label="Address"     value={billingAddress} />
                <ProfileField label="City"        value={billingCity} />
                <ProfileField label="State"       value={billingState} />
                <ProfileField label="Postal Code" value={billingPostal} />
                <ProfileField label="Country"     value={billingCountry} />
              </div>
            )}
          </div>
        </div>

        {/* Mobile action buttons at bottom */}
        <div className="bg-white w-full pt-5 pb-5 mt-5">
          <div className="flex flex-col md:flex-row justify-center items-center gap-4">
            <Button
              type="button"
              variant="dark-blue"
              onClick={() => setShowPasswordModal(true)}
              className="rounded-xl w-full text-center py-6 shadow-[0px_3px_6px_#2976a54d]"
            >
              <MdLockReset /> Change Password
            </Button>
            <Button
              type="button"
              variant="orange"
              onClick={() => setShowDeleteModal(true)}
              disabled={deleteUserMutation.isPending}
              className="rounded-xl w-full text-center py-6 shadow-[0px_3px_6px_#FF66004D]"
            >
              {deleteUserMutation.isPending
                ? "Deleting…"
                : <>
                    <IoTrashSharp /> Delete Account
                  </>
              }
            </Button>
          </div>
        </div>
      </div>

      {/* Modals */}
      <PasswordModalComponent
        open={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        id={id}
      />
      <ConfirmationModalComponent
        open={showDeleteModal}
        onCancel={() => setShowDeleteModal(false)}
        onYes={() => deleteUserMutation.mutate(id!)}
        heading="Delete Account"
        text="Are you sure you want to delete your account? All your data will be permanently deleted. This action cannot be undone."
      />
    </>
  );
};

export default Page;
