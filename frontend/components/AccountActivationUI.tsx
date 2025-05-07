import React from "react";
import { Card, CardContent, CardHeader } from "components/ui/card";
import BackToLogin from "./BackToLogin";
import { FaEnvelopeOpenText } from "react-icons/fa";

interface AccountActivationUIProps {
  email: string;
}

const AccountActivationUI: React.FC<AccountActivationUIProps> = ({ email }) => {
  return (
    <div className="py-20 min-h-screen flex flex-col justify-center items-center">
      <Card className="max-w-2xl mx-auto rounded-xl">
        <CardHeader className="flex justify-center items-center py-5">
          <FaEnvelopeOpenText className="h-16 w-16 text-black" />
        </CardHeader>
        <CardContent className="px-10 lg:px-20">
          <div className="text-center space-y-4">
            <h1 className="font-bold text-2xl md:text-3xl">
              Account Activation
            </h1>
            <p className="text-slate-600">
              Thank you for signing up. A verification link has been sent to
            </p>
            <p className="text-gray-500 text-lg">{email}</p>
            <p className="text-slate-600">
              Please click the link in the email to verify your account.
            </p>
          </div>

          {/* Uncomment to include Resend Email button
          <div className="pt-10">
            <Button 
              variant="default" 
              className="w-full font-bold text-lg py-2 rounded-xl"
            >
              Resend Email
            </Button>
          </div>
          */}

          <div className="pt-14 pb-16 text-center">
            <BackToLogin />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AccountActivationUI;
