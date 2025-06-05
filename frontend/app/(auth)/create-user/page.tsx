"use client";

import React from "react";
import Image from "next/image";
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
import { zodResolver } from "@hookform/resolvers/zod";
import { FieldErrors, useForm } from "react-hook-form";
import Logo from "components/LogoComponent";
import FooterComponent from "components/FooterComponent";
import TextInputField from "components/createAccount/TextInputField";
import PasswordField from "components/createAccount/PasswordField";
import { RegisterFormValues, registerSchema } from "schemas/registerSchema";
import { useCountryList } from "hooks/useCountryList";
import { registerDefaults } from "constant";
import CountrySelector from "components/createAccount/countrySelector";
import { useRegister } from "hooks/useRegister";

const Register = () => {

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: registerDefaults,
  });

  const {
    countries,
    isLoading: countriesLoading,
    selectedCountry,
    setSelectedCountry,
  } = useCountryList();

  const handleErrors = (errors: FieldErrors<RegisterFormValues>) => {
    Object.values(errors).forEach((fieldError) => {
      if (fieldError?.message) {
        toast.error(fieldError.message);
      }
    });
  };

   const registerMutation = useRegister();

   const onSubmit = (values: RegisterFormValues) => {
    const fullPhoneNumber = selectedCountry
      ? `+${selectedCountry.code}${values.phoneNumber}`
      : values.phoneNumber;

    registerMutation.mutate({ values, fullPhoneNumber });
  };
  const handleRegister = form.handleSubmit(onSubmit, handleErrors);

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
              <Form {...form}>
                <form
                  onSubmit={handleRegister}
                  className="lg:px-24 px-4 space-y-4"
                >
                  <div className="lg:flex lg:gap-4 space-y-4 lg:space-y-0">
                    <TextInputField
                      control={form.control}
                      name="firstName"
                      label="First Name"
                      placeholder="Enter your first name"
                      className="flex-1"
                    />
                    <TextInputField
                      control={form.control}
                      name="lastName"
                      label="Last Name"
                      placeholder="Enter your last name"
                      className="flex-1"
                    />
                  </div>

                  <TextInputField
                    control={form.control}
                    name="email"
                    label="Email"
                    placeholder="Enter your email"
                    type="email"
                  />
                  <div className="lg:flex lg:gap-4 space-y-4 lg:space-y-0">
                    <div className="flex-1">
                      <FormField
                        control={form.control}
                        name="phoneNumber"
                        render={({ field }) => (
                          <FormItem className="w-full">
                            <FormLabel>Phone Number</FormLabel>
                            <div className="flex">
                              <CountrySelector
                                countries={countries}
                                isLoading={countriesLoading}
                                selectedCountry={selectedCountry}
                                onSelect={setSelectedCountry}
                              />

                              <FormControl>
                                <Input
                                  placeholder="Enter your phone number"
                                  {...field}
                                  onChange={(e) => {
                                    const value = e.target.value.replace(
                                      /[^0-9]/g,
                                      ""
                                    );
                                    field.onChange(value);
                                  }}
                                  className="rounded-l-none flex-1"
                                />
                              </FormControl>
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <TextInputField
                      control={form.control}
                      name="companyName"
                      label="Company Name"
                      placeholder="Enter your company name"
                      className="flex-1"
                    />
                  </div>
                  {/* Password */}
                  <PasswordField
                    control={form.control}
                    name="password"
                    label="Password"
                    placeholder="Enter your password"
                  />

                  {/* Confirm Password */}
                  <PasswordField
                    control={form.control}
                    name="confirmPassword"
                    label="Confirm Password"
                    placeholder="Confirm your password"
                  />

                  <FormField
                    control={form.control}
                    name="terms"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start">
                        <FormControl>
                          <div className="flex h-5 items-center mt-1">
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </div>
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
                            experience throughout this website to manage access
                            to your account, and for other purposes described in
                            our{" "}
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
                  <Button
                    type="submit"
                    className="w-full bg-orange-500 hover:bg-orange-600 mt-4"
                    disabled={registerMutation.isPending}
                  >
                    {registerMutation.isPending
                      ? "Registering..."
                      : "Create Account"}
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
