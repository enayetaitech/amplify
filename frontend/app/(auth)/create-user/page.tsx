"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "components/ui/card";
import Logo from "components/LogoComponent";
import FooterComponent from "components/FooterComponent";
import RegisterForm from "components/createAccount/RegisterForm";

const Register = () => {


  return (
    <div>
      <div className="hidden lg:justify-center lg:items-start lg:flex bg-white h-10">
        <div className="flex-1 flex items-center w-full h-full">
          <div className="pl-10 pt-8">
            <Logo />
          </div>
        </div>
        <div className="flex-1 bg-slate-100 h-10"></div>
      </div>
      <div className="lg:hidden bg-white flex justify-center items-center pt-5">
        <Logo />
      </div>
      <div className="lg:flex lg:justify-center lg:items-center">
        <div className="flex-1 pb-10 lg:pb-0">
          <Card className="border-0 shadow-none">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl font-bold uppercase">
                CREATE ACCOUNT
              </CardTitle>
            </CardHeader>
            <CardContent>
             <RegisterForm/>
              <p className="mt-6 text-center">
                Already have an account?{" "}
                <Link href="/login" className="text-blue-500 ml-1">
                  Login
                </Link>
              </p>
            </CardContent>
          </Card>
        </div>
        <div className="hidden lg:flex lg:flex-1 lg:bg-[#F6F8FA] min-h-screen">
          <div className="flex-1 flex justify-center items-start">
            <Image
              src="/register.jpg"
              alt="Amplify register"
              height={800}
              width={600}
            />
          </div>
        </div>
      </div>
      <FooterComponent />
    </div>
  );
};

export default Register;
