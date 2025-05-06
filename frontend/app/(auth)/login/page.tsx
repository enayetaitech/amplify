"use client";

import React, { useState } from "react";
import axios, { AxiosError } from "axios";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "components/ui/form";
import { Input } from "components/ui/input";
import { Checkbox } from "components/ui/checkbox";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "components/ui/button";
import Logo from "components/LogoComponent";
import { IUser } from "../../../../shared/interface/UserInterface";
import { useGlobalContext } from "context/GlobalContext";
import FooterComponent from "components/FooterComponent";

const loginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(1, { message: "Password is required" }),
  rememberMe: z.boolean(),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const Login = () => {
  const router = useRouter();
  const { setUser, setToken } = useGlobalContext();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Initialize the form with react-hook-form and zod validation
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });

  const onSubmit = async (values: LoginFormValues) => {
    try {
      setIsLoading(true);

      const response = await axios.post<{
        data: { user: IUser; token: string };
        message: string;
      }>(
        `${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/api/v1/users/login`,
        {
          email: values.email,
          password: values.password,
        },
        { withCredentials: true }
      );

      const { user, token } = response.data.data;

      setUser(user);
      setToken(token);

      if (typeof window !== "undefined") {
        localStorage.setItem("user", JSON.stringify(user));
        localStorage.setItem("token", token);
      }

      if (typeof window !== "undefined") {
        window.localStorage.setItem(
          "user",
          JSON.stringify(response.data.data.user)
        );
      }

      const redirectUrl = `/projects`;
      router.replace(redirectUrl);
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      const errorMessage = axiosError.response?.data?.message || "Login failed";
      toast.error(errorMessage);
      setIsLoading(false);
    }
  };

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
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="lg:px-24 px-4 space-y-4"
                >
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter your email"
                            type="email"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              placeholder="Enter your password"
                              type={showPassword ? "text" : "password"}
                              {...field}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="absolute right-0 top-0 h-full pr-2"
                              onClick={() => setShowPassword(!showPassword)}
                            >
                              {showPassword ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
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
                    disabled={isLoading}
                  >
                    {isLoading ? "Loading..." : "Login"}
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
