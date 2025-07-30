// components/MyProfilePage.tsx
"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import PasswordModalComponent from "components/PasswordModalComponent";
import ConfirmationModalComponent from "components/ConfirmationModalComponent";
import { useGlobalContext } from "context/GlobalContext";
import { useDeleteUser } from "hooks/useDeleteUser";
import { useProfileModals } from "hooks/useProfileModals";
import { ProfileDetailsCard } from "components/profile/ProfileDetailsCard";

const Page: React.FC = () => {
  const { user } = useGlobalContext();
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const deleteUserMutation = useDeleteUser();
  const {
    showPasswordModal,
    setShowPasswordModal,
    showDeleteModal,
    setShowDeleteModal,
  } = useProfileModals();

  // Derive displayable strings once, so JSX stays clean:
  const firstName = user?.firstName?.toUpperCase() ?? "Loading...";
  const lastName = user?.lastName?.toUpperCase() ?? "Loading...";
  const role = user?.role?.toUpperCase() ?? "Loading...";
  const email = user?.email ?? "Loading...";
  const credits = user?.credits?.toString() ?? "0";
  const phoneNumber = user?.phoneNumber ?? "Loading...";
  const companyName = user?.companyName ?? "Loading...";
  const billingInfo = user?.billingInfo
    ? {
        address: user.billingInfo.address ?? "",
        city: user.billingInfo.city ?? "",
        state: user.billingInfo.state ?? "",
        postalCode: user.billingInfo.postalCode ?? "",
        country: user.billingInfo.country ?? "",
      }
    : null;

  return (
    <>
      <div className="my_profile_main_section_shadow bg-[#fafafb] bg-opacity-90 h-full min-h-screen flex-col justify-center items-center relative">
        <div className="bg-white h-16 w-full px-10 flex justify-between items-center pt-2">
          <p className="text-2xl font-bold text-custom-teal">My Profile</p>
        </div>

        {/* Profile Details Card */}
        <ProfileDetailsCard
          firstName={firstName}
          lastName={lastName}
          role={role}
          email={email}
          credits={credits}
          phoneNumber={phoneNumber}
          companyName={companyName}
          billingInfo={billingInfo}
          onEdit={() => router.push(`/edit-profile/${id}`)}
          onChangePassword={() => setShowPasswordModal(true)}
          onDelete={() => setShowDeleteModal(true)}
          isDeleting={deleteUserMutation.isPending}
        />

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
      </div>
    </>
  );
};

export default Page;
