"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import Image from "next/image";
import { Check, ChevronsUpDown, Eye, EyeOff } from "lucide-react";
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
import { FieldErrors, useForm } from "react-hook-form";
import Logo from "components/LogoComponent";
import { useMutation } from "@tanstack/react-query";
import { Popover, PopoverContent, PopoverTrigger } from "components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "components/ui/command";
import { cn } from "lib/utils";

import api from "lib/api";
import { IUser } from "@shared/interface/UserInterface";
import { ApiResponse } from "@shared/interface/ApiResponseInterface";
import FooterComponent from "components/FooterComponent";


interface CountryCode {
  country: string;
  code: string;
  iso: string;
}
// Zod schema updated
const registerSchema = z
  .object({
     firstName: z
      .string()
      .min(1, { message: "First Name is required" })
      .regex(/^[A-Za-z ]+$/, { message: "First Name can only contain letters and spaces" }),

    lastName: z
      .string()
      .min(1, { message: "Last Name is required" })
      .regex(/^[A-Za-z ]+$/, { message: "Last Name can only contain letters and spaces" }),

    email: z.string().email({ message: "Please enter a valid email address" }),
     companyName: z
      .string()
      .min(1, { message: "Company name is required" })
      .regex(/^[A-Za-z ]+$/, { message: "Company Name can only contain letters and spaces" }),

    phoneNumber: z.string().min(10, { message: "Phone number is required" }),
    password: z.string().min(9, {
      message: "Password must be at least 9 characters long",
    }),
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

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phoneNumber: "",
      companyName: "",
      password: "",
      confirmPassword: "",
      terms: false,
    },
  });
  const [countries, setCountries] = useState<CountryCode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<CountryCode | null>(
    null
  );

  useEffect(() => {
    const fetchCountries = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get(
          "https://api.npoint.io/900fa8cc45c942a0c38e"
        );
        setCountries(response.data);
        // Default to US or first country in the list
        const defaultCountry =
          response.data.find((c: CountryCode) => c.iso === "US") ||
          response.data[0];
        setSelectedCountry(defaultCountry);
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching country data:", error);
        setIsLoading(false);
      }
    };

    fetchCountries();
  }, []);

    const handleErrors = (errors: FieldErrors<RegisterFormValues>) => {
    Object.values(errors).forEach((fieldError) => {
      if (fieldError?.message) {
        toast.error(fieldError.message);
      }
    });
  };

  const registerMutation = useMutation({
    mutationFn: async (values: RegisterFormValues) => {
      const res = await api.post<ApiResponse<IUser>>(
        `/api/v1/users/register`,
        {
          firstName: values.firstName,
          lastName: values.lastName,
          email: values.email,
          phoneNumber: values.phoneNumber,
          companyName: values.companyName,
          password: values.password,
          termsAccepted: values.terms,
          role: "Admin",
        }
      );
      return res.data.data;
    },
    onSuccess: (data, variables) => {
      toast.success("Your registration was successful!");
      router.push(
        `/account-activation?email=${encodeURIComponent(variables.email)}`
      );
    },
    onError: (error: unknown) => {
      if (axios.isAxiosError(error)) {
        console.error("error", error);
        const message = error.response?.data?.message || "Registration failed";
        console.error("message", message);
        toast.error(message);
      } else {
        console.error("Unexpected error", error);
        toast.error("Registration failed");
      }
    },
  });

  const onSubmit = (values: RegisterFormValues) => {
    registerMutation.mutate(values);
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
                            type="email"
                            placeholder="Enter your email"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
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
                              <Popover open={open} onOpenChange={setOpen}>
                                <PopoverTrigger asChild>
                                  <Button
                                    variant="outline"
                                    role="combobox"
                                    aria-expanded={open}
                                    disabled={isLoading}
                                    className="w-32 justify-between border-r-0 rounded-r-none"
                                  >
                                    {selectedCountry ? (
                                      <div className="flex items-center">
                                        <span className="mr-1">
                                          {selectedCountry.iso}
                                        </span>
                                        <span>+{selectedCountry.code}</span>
                                      </div>
                                    ) : (
                                      "Select country"
                                    )}
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-64 p-0">
                                  <Command>
                                    <CommandInput placeholder="Search country or code..." />
                                    <CommandEmpty>
                                      No country found.
                                    </CommandEmpty>
                                    <CommandGroup className="max-h-64 overflow-y-auto">
                                      {countries.map((country) => (
                                        <CommandItem
                                          key={country.iso}
                                          value={`${country.country} ${country.code} ${country.iso}`}
                                          onSelect={() => {
                                            setSelectedCountry(country);
                                            setOpen(false);
                                          }}
                                        >
                                          <Check
                                            className={cn(
                                              "mr-2 h-4 w-4",
                                              selectedCountry?.iso ===
                                                country.iso
                                                ? "opacity-100"
                                                : "opacity-0"
                                            )}
                                          />
                                          <div className="flex justify-between w-full">
                                            <span>{country.country}</span>
                                            <span className="text-gray-500">
                                              +{country.code}
                                            </span>
                                          </div>
                                        </CommandItem>
                                      ))}
                                    </CommandGroup>
                                  </Command>
                                </PopoverContent>
                              </Popover>

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
                    <FormField
                      control={form.control}
                      name="companyName"
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormLabel>Company Name</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter your company name"
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
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              type={showPassword ? "text" : "password"}
                              placeholder="Enter your password"
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
                        {/* <FormDescription className="text-orange-500 text-xs">
                          Password must contain 9 or more characters
                        </FormDescription> */}
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
                              type={showPassword ? "text" : "password"}
                              placeholder="Confirm your password"
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
