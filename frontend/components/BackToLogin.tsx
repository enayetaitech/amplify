"use client";
import React from "react";
import { Button } from "components/ui/button";
import Link from "next/link";

interface BackToLoginProps {
  className?: string;
}

const BackToLogin: React.FC<BackToLoginProps> = ({ className }) => {
  return (
    <Button
      variant="link"
      className={`text-blue-500 font-semibold text-center text-lg ${className}`}
      asChild
    >
      <Link href="/login">Back To Login</Link>
    </Button>
  );
};

export default BackToLogin;
