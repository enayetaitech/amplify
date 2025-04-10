"use client";

import React, { useState } from "react";
import axios, { AxiosError } from "axios";
import { FaEnvelopeOpenText } from "react-icons/fa";
import { Input } from "components/ui/input";
import { Button } from "components/ui/button";
import { Label } from "components/ui/label";

import Logo from "components/Logo";
import { Alert, AlertDescription } from "components/ui/alert";
import { toast } from "sonner";

const ForgotPassword = () => {
  const [email, setEmail] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [error, setError] = useState<string>("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/api/users/forgot-password`,
        {
          email: email,
        }
      );
      setMessage("Reset link sent to your email");
      setError("");
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      const errorMessage =
        axiosError.response?.data?.message || "Error sending reset link";
      toast.error(errorMessage);
      setError("Error sending reset link");
      setMessage("");
    }
  };
  return (
    <div>
      <div className="flex justify-center items-center pt-5 lg:hidden">
        <Logo />
      </div>
      <div className="pt-5 pl-10 lg:block hidden">
        {" "}
        <Logo />
      </div>
      <div className="py-20">
        <div className="max-w-[800px] mx-auto px-10 lg:px-20 bg-white rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.15),0_-4px_12px_rgba(0,0,0,0.1)]">
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
                onChange={handleChange}
                className="w-full"
              />
            </div>
            <Button
              variant="default"
              className="w-full bg-orange-500 hover:bg-orange-600"
              type="submit"
            >
              Send Reset Link
            </Button>
          </form>
          {message && (
            <Alert
              variant="default"
              className="mt-4 bg-green-50 border-green-500"
            >
              <AlertDescription className="text-green-500 text-center">
                {message}
              </AlertDescription>
            </Alert>
          )}
          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertDescription className="text-center">
                {error}
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
    </div>
  );
};

export default ForgotPassword;
