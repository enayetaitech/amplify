"use client";

import React, { useState } from "react";
import axios, { AxiosError } from "axios";
import Image from "next/image";
import { Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "components/ui/card";
import { Button } from "components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "components/ui/form";
import { Input } from "components/ui/input";
import { Checkbox } from "components/ui/checkbox";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import Logo from "components/Logo";

// Define the form schema with validation rules
const registerSchema = z
  .object({
    firstName: z.string().min(1, { message: "First Name is required" }),
    lastName: z.string().min(1, { message: "Last Name is required" }),
    email: z.string().email({ message: "Please enter a valid email address" }),
    password: z
      .string()
      .min(9, { message: "Password must be at least 9 characters long" }),
    confirmPassword: z
      .string()
      .min(1, { message: "Please confirm your password" }),
    terms: z.boolean().refine((val) => val === true, {
      message: "You must accept the Terms & Conditions",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

const Register = () => {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [emailAvailable, setEmailAvailable] = useState("");

  // Initialize form
  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "Ab123456@",
      confirmPassword: "Ab123456@",
      terms: false,
    },
  });

  const onSubmit = async (values: RegisterFormValues) => {
    try {
      setIsLoading(true);

      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/api/users/create`,
        {
          firstName: values.firstName,
          lastName: values.lastName,
          email: values.email,
          password: values.password,
          terms: values.terms,
        }
      );

      if (response.status === 200) {
        toast.success("Your registration was successful!");
        router.push(
          `/account-activation?email=${encodeURIComponent(values.email)}`
        );
      } else {
        toast.error(`${response.data.message}`);
      }
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      const errorMessage =
        axiosError.response?.data?.message || "Registration failed";
      toast.error(errorMessage);
      console.error("Error creating user:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      {/* Top div for lg */}
      <div className="hidden lg:justify-center lg:items-start lg:flex bg-white h-10">
        {/* left image div */}
        <div className="flex-1 flex items-center w-full h-full">
          <div className="pl-10 pt-8">
            <Logo />
          </div>
        </div>
        <div className="flex-1 bg-slate-100 h-10"></div>
      </div>

      {/* Top div for mobile */}
      <div className="lg:hidden bg-white flex justify-center items-center pt-5">
        <Logo />
      </div>

      {/* Bottom div for large screen */}
      <div className="lg:flex lg:justify-center lg:items-center">
        {/* left div */}
        <div className="flex-1 pb-10 lg:pb-0">
          <Card className="border-0 shadow-none">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl font-bold uppercase">
                Register
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="lg:px-24 px-4 space-y-4"
                >
                  <div className="lg:flex lg:gap-4 space-y-4 lg:space-y-0">
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormLabel>First Name</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter your first name"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormLabel>Last Name</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter your last name"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter your email"
                            type="email"
                            {...field}
                          />
                        </FormControl>
                        {emailAvailable && (
                          <p className="text-green-600 text-sm">
                            {emailAvailable}
                          </p>
                        )}
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
                        <FormDescription className="text-orange-500 text-xs">
                          Password must contain 9 or more characters
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              placeholder="Confirm your password"
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

                  <div className="mt-4 space-y-2">
                    <FormField
                      control={form.control}
                      name="terms"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-2 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel className="font-semibold text-base">
                              I agree to the{" "}
                              <Link
                                href="/terms-of-condition"
                                className="text-blue-500 font-bold"
                              >
                                Terms & Conditions
                              </Link>
                            </FormLabel>
                            <FormDescription className="text-sm">
                              Your personal data will be used to support your
                              experience throughout this website to manage
                              access to your account, and for other purposes
                              described in our{" "}
                              <Link
                                href="/privacy-policy"
                                className="text-blue-500 underline"
                              >
                                Privacy Policy
                              </Link>
                              .
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-orange-500 hover:bg-orange-600 mt-4"
                    disabled={isLoading}
                  >
                    {isLoading ? "Registering..." : "Create Account"}
                  </Button>
                </form>
              </Form>

              <p className="mt-6 text-center">
                Already have an account?{" "}
                <Link href="/login" className="text-blue-500 ml-1">
                  Login
                </Link>
              </p>
            </CardContent>
          </Card>
        </div>

        {/* right div */}
        <div className="hidden lg:flex lg:flex-1 lg:bg-slate-100 min-h-screen">
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
    </div>
  );
};

export default Register;
