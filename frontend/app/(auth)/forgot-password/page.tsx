"use client";

import React, { useState } from "react";

import { FaEnvelopeOpenText } from "react-icons/fa";
import { Input } from "components/ui/input";
import { Button } from "components/ui/button";
import { Label } from "components/ui/label";
import Logo from "components/LogoComponent";
import { Alert, AlertDescription } from "components/ui/alert";
import FooterComponent from "components/FooterComponent";
import useForgotPassword from "hooks/useForgotPassword";

const ForgotPassword = () => {
  const [email, setEmail] = useState<string>("");

   const {
   mutate: sendResetLink,
   isPending: isLoading,
   isError,
   isSuccess,
   data,
   error,
 } = useForgotPassword();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendResetLink({ email });
  };

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-none">
        <div className="flex justify-center items-center pt-5 lg:hidden">
          <Logo />
        </div>
        <div className="pt-5 pl-10 lg:block hidden">
          <Logo />
        </div>
      </div>

      <div className="py-20 flex-grow flex items-center justify-center">
        <div className="max-w-[800px] w-full mx-auto px-10 lg:px-20 bg-white rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.15),0_-4px_12px_rgba(0,0,0,0.1)]">
          <div className="flex justify-center items-center py-5">
            <FaEnvelopeOpenText className="h-20 w-20" />
          </div>
          <div className="px-3">
            <h1 className="text-3xl font-bold text-center">FORGOT PASSWORD</h1>
            <p className="text-blue-600 text-center mt-2">
              Send a link to your email to reset your password.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="pt-10">
            <div className="mb-4">
              <Label htmlFor="email" className="block mb-2">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                className="w-full"
              />
            </div>
            <Button
              variant="default"
              className="w-full bg-orange-500 hover:bg-orange-600"
              type="submit"
              disabled={isLoading}
            >
              {isLoading  ? "Sending..." : "Send Reset Link"}
            </Button>
          </form>

          {isSuccess && (
            <Alert
              variant="default"
              className="mt-4 bg-green-50 border-green-500"
            >
              <AlertDescription className="text-green-500 text-center">
                {data.message}
              </AlertDescription>
            </Alert>
          )}

          {isError && (
            <Alert variant="destructive" className="mt-4">
              <AlertDescription className="text-center">
                {error.response?.data.message ||
                  error.message ||
                  "Error sending reset link"}
              </AlertDescription>
            </Alert>
          )}

          <div className="pt-14 pb-20">
            <div className="flex justify-center">
              <a href="/login" className="text-blue-600 font-semibold">
                Back to Login
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-none mt-auto">
        <FooterComponent />
      </div>
    </div>
  );
};

export default ForgotPassword;
