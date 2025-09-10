
import React from "react";
import Image from "next/image";

import Logo from "components/shared/LogoComponent";
import FooterComponent from "components/shared/FooterComponent";

const RemoveParticipant = () => {


  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Header */}
      <div className="px-4 lg:px-8 py-2">
        <Logo />
      </div>

      {/* Main */}
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="w-full">
          {/* Message Card */}
          <div className="mx-auto  w-full max-w-md p-6 text-center">
            <h2 className="text-lg lg:text-xl font-semibold mb-2">
              Remove Participant
            </h2>
            <p className="text-sm text-muted-foreground mb-1">
              You have been removed from the meeting by the host.
            </p>
         
          </div>
          {/* Illustration */}
          <div className="w-full flex justify-center">
            <Image
              src="/join-meeting-edited.png"
              alt="Amplify illustration"
              width={900}
              height={520}
              className="w-full h-auto max-w-3xl"
              priority
            />
          </div>

        </div>
      </div>

      {/* Footer */}
      <FooterComponent />
    </div>
  );
};

export default RemoveParticipant;
