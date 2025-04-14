"use client";
import React from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Skeleton } from "components/ui/skeleton";
import AccountActivationUI from "components/AccountActivationUI";
import Logo from "components/LogoComponent";
import FooterComponent from "components/FooterComponent";

const AccountActivationContent: React.FC = () => {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";

  return <AccountActivationUI email={email} />;
};

const AccountActivationLoading: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <Skeleton className="h-12 w-48 mb-8" />
      <Skeleton className="h-64 w-full max-w-2xl rounded-xl" />
    </div>
  );
};

const AccountActivation: React.FC = () => {
  return (
    <div>
      <div className="flex justify-center items-center pt-5 lg:hidden">
        <Logo />
      </div>
      <div className="pt-5 pl-10 hidden lg:block">
        <Logo />
      </div>
      <Suspense fallback={<AccountActivationLoading />}>
        <AccountActivationContent />
      </Suspense>
      <FooterComponent />
    </div>
  );
};

export default AccountActivation;
