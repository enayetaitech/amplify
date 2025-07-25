// components/RegisterForm.tsx
"use client";

import React from "react";
import { toast } from "sonner";
import { useForm, FieldErrors } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "components/ui/form";
import { Input } from "components/ui/input";
import { Checkbox } from "components/ui/checkbox";
import { Button } from "components/ui/button";
import TextInputField from "components/createAccount/TextInputField";
import PasswordField from "components/createAccount/PasswordField";

import { useCountryList } from "hooks/useCountryList";
import { useRegister } from "hooks/useRegister";
import { registerSchema, RegisterFormValues } from "schemas/registerSchema";
import { registerDefaults } from "constant";
import Link from "next/link";
import CountrySelector from "./countrySelector";

export default function RegisterForm() {
  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: registerDefaults,
  });

  const { countries, isLoading: countriesLoading, selectedCountry, setSelectedCountry } = useCountryList();
  const registerMutation = useRegister();

  const handleErrors = (errors: FieldErrors<RegisterFormValues>) => {
    Object.values(errors).forEach((fieldError) => {
      if (fieldError?.message) {
        toast.error(fieldError.message);
      }
    });
  };

  const onSubmit = (values: RegisterFormValues) => {
    const fullPhoneNumber = selectedCountry
      ? `+${selectedCountry.code}${values.phoneNumber}`
      : values.phoneNumber;
    registerMutation.mutate({ values, fullPhoneNumber });
  };
  const handleRegister = form.handleSubmit(onSubmit, handleErrors);

  return (
    <Form {...form}>
      <form onSubmit={handleRegister} className="lg:px-24 px-4 space-y-4">
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
                          const value = e.target.value.replace(/[^0-9]/g, "");
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

        <PasswordField
          control={form.control}
          name="password"
          label="Password"
          placeholder="Enter your password"
        />

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
                  <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                </div>
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel className="font-semibold text-base">
                  I agree to the{" "}
                  <Link target="_blank" href="/terms-of-condition" className="text-blue-500 font-bold">
                    Terms & Conditions
                  </Link>
                </FormLabel>
                <FormDescription className="text-sm">
                  Your personal data will be used to support your experience throughout this website to manage access to your account, and for other purposes described in our{" "}
                  <Link target="_blank" href="/privacy-policy" className="text-blue-500 underline">
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
          {registerMutation.isPending ? "Registering..." : "Create Account"}
        </Button>
      </form>
    </Form>
  );
}
