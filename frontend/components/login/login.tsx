"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "components/ui/form";
import { Checkbox } from "components/ui/checkbox";
import { zodResolver } from "@hookform/resolvers/zod";
import { FieldErrors, useForm } from "react-hook-form";
import { Button } from "components/ui/button";
import Logo from "components/shared/LogoComponent";
import FooterComponent from "components/shared/FooterComponent";
import TextInputField from "components/createAccount/TextInputField";
import PasswordField from "components/createAccount/PasswordField";
import { LoginFormValues, loginSchema } from "schemas/loginSchema";
import { loginDefaults } from "constant";
import { useLogin } from "hooks/useLogin";

const Login = () => {
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: loginDefaults,
  });

  const loginMutation = useLogin();

  const { mutate: login, isPending } = loginMutation;

  const handleErrors = (errors: FieldErrors<LoginFormValues>) => {
    Object.values(errors).forEach((fieldError) => {
      console.log("errors", errors);
      if (fieldError?.message) {
        toast.error(fieldError.message);
      }
    });
  };

  const onSubmit = form.handleSubmit((vals) => {
    login(vals);
  }, handleErrors);

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
              <CardTitle className="text-3xl font-bold">LOGIN</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={onSubmit} className="lg:px-24 px-4 space-y-4">
                  {/* Email Field */}
                  <TextInputField
                    control={form.control}
                    name="email"
                    label="Email Address"
                    placeholder="Enter your email"
                    type="email"
                    disabled={isPending}
                  />

                  {/* Password Field */}
                  <PasswordField
                    control={form.control}
                    name="password"
                    label="Password"
                    placeholder="Enter your password"
                    disabled={isPending}
                  />
                  <div className="flex items-center justify-between">
                    <FormField
                      control={form.control}
                      name="rememberMe"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              disabled={isPending}
                            />
                          </FormControl>
                          <FormLabel className="text-sm font-normal">
                            Remember me
                          </FormLabel>
                        </FormItem>
                      )}
                    />
                    <Link
                      href="/forgot-password"
                      className="text-blue-500 text-sm"
                    >
                      Forgot Password?
                    </Link>
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-orange-500 hover:bg-orange-600"
                    disabled={isPending}
                  >
                    {isPending ? "Loading..." : "Login"}
                  </Button>
                </form>
              </Form>
              <p className="mt-6 text-center">
                Don&apos;t have an Account?{" "}
                <Link href="/create-user" className="text-blue-500">
                  Create Account
                </Link>
              </p>
            </CardContent>
          </Card>
        </div>
        <div className="flex-1 bg-[#F6F8FA] min-h-screen hidden lg:block">
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

export default Login;
