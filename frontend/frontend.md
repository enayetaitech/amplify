### app/(auth)/account-activation/page.tsx

```javascript
"use client";
import React from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Skeleton } from "components/ui/skeleton";
import AccountActivationUI from "components/AccountActivationUI";
import Logo from "components/LogoComponent";
import FooterComponent from "components/FooterComponent";

const AccountActivationContent: React.FC = () => {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";

  return <AccountActivationUI email={email} />;
};

const AccountActivationLoading: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <Skeleton className="h-12 w-48 mb-8" />
      <Skeleton className="h-64 w-full max-w-2xl rounded-xl" />
    </div>
  );
};

const AccountActivation: React.FC = () => {
  return (
    <div>
      <div className="flex justify-center items-center pt-5 lg:hidden">
        <Logo />
      </div>
      <div className="pt-5 pl-10 hidden lg:block">
        <Logo />
      </div>
      <Suspense fallback={<AccountActivationLoading />}>
        <AccountActivationContent />
      </Suspense>
      <FooterComponent />
    </div>
  );
};

export default AccountActivation;

```


### app/(auth)/create-user/page.tsx
```javascript
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
import { useForm } from "react-hook-form";
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
    firstName: z.string().min(1, { message: "First Name is required" }),
    lastName: z.string().min(1, { message: "Last Name is required" }),
    email: z.string().email({ message: "Please enter a valid email address" }),
    companyName: z.string().min(1, { message: "Company name is required" }),
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

```

### app/(auth)/forgot-password/page.tsx
```javascript
"use client";

import React, { useState } from "react";

import { FaEnvelopeOpenText } from "react-icons/fa";
import { Input } from "components/ui/input";
import { Button } from "components/ui/button";
import { Label } from "components/ui/label";
import Logo from "components/LogoComponent";
import { Alert, AlertDescription } from "components/ui/alert";
import { toast } from "sonner";

import api from "lib/api";
import {
  ApiResponse,
  ErrorResponse,
} from "@shared/interface/ApiResponseInterface";
import { useMutation } from "@tanstack/react-query";
import FooterComponent from "components/FooterComponent";


const ForgotPassword = () => {
  const [email, setEmail] = useState<string>("");

  const mutation = useMutation<
    ApiResponse<null>,
    // TError:
    { response?: { data: ErrorResponse } } & Error,
    // TVariables:
    string
  >({
    // 1️⃣ The mutationFn, typed to accept a string and return ApiResponse<null>
    mutationFn: (email: string) =>
      api
        .post<ApiResponse<null>>("/api/v1/users/forgot-password", { email })
        .then((res) => res.data),

    // 2️⃣ onSuccess sees ApiResponse<null> and the original email string
    onSuccess: (response: ApiResponse<null>) => {
      toast.success(response.message);
    },

    // 3️⃣ onError sees our Error type with potential response.data.message
    onError: (error) => {
      const serverMsg =
        error.response?.data.message || error.message || "Something went wrong";
      toast.error(serverMsg);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(email);
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
                disabled={mutation.isPending}
                className="w-full"
              />
            </div>
            <Button
              variant="default"
              className="w-full bg-orange-500 hover:bg-orange-600"
              type="submit"
              disabled={mutation.isPending}
            >
              {mutation.isPending ? "Sending..." : "Send Reset Link"}
            </Button>
          </form>

          {mutation.isSuccess && (
            <Alert
              variant="default"
              className="mt-4 bg-green-50 border-green-500"
            >
              <AlertDescription className="text-green-500 text-center">
                {mutation.data.message}
              </AlertDescription>
            </Alert>
          )}

          {mutation.isError && (
            <Alert variant="destructive" className="mt-4">
              <AlertDescription className="text-center">
                {mutation.error.response?.data.message ||
                  mutation.error.message ||
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

```

### app/(auth)/login/page.tsx
```javascript
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

import { ApiResponse, ErrorResponse } from "@shared/interface/ApiResponseInterface";
import { useMutation } from "@tanstack/react-query";
import api from "lib/api";

import FooterComponent from "components/FooterComponent";


const loginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(1, { message: "Password is required" }),
  rememberMe: z.boolean(),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const Login = () => {
  const router = useRouter();
  const { setUser } = useGlobalContext();
  const [showPassword, setShowPassword] = useState(false);


  // Initialize the form with react-hook-form and zod validation
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });

   // Mutation for login
   const loginMutation = useMutation<
   ApiResponse<{ user: IUser; token: string }>,
   AxiosError<ErrorResponse>,
   LoginFormValues
 >({
   mutationFn: (vals) =>
     api
       .post<ApiResponse<{ user: IUser; token: string }>>(
         "/api/v1/users/login",
         {
           email: vals.email,
           password: vals.password,
         },
         { withCredentials: true }
       )
       .then((res) => res.data),

   onSuccess: (resp) => {
     const { user } = resp.data;
     setUser(user);
     localStorage.setItem("user", JSON.stringify(user));
     toast.success(resp.message);
     router.replace("/projects");
   },

   onError: (err) => {
     const msg = axios.isAxiosError(err)
       ? err.response?.data.message ?? err.message
       : "Login failed";
     toast.error(msg);
   },
 });

 const onSubmit = form.handleSubmit((vals) => {
   loginMutation.mutate(vals);
 });


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
                  onSubmit={onSubmit}
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
                    disabled={loginMutation.isPending}
                  >
                   {loginMutation.isPending ? "Loading..." : "Login"}
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

```

### app/(dashboard)/create-project/page.tsx
```javascript
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import axios, { AxiosError } from "axios";
import { useGlobalContext } from "context/GlobalContext";
import { Button } from "components/ui/button";
import Step1 from "components/projects/createProject/Step1Component";
import Step2 from "components/projects/createProject/Step2Component";
import Step3 from "components/projects/createProject/Step3Component";
import Step4 from "components/projects/createProject/Step4Component";
import { IProjectFormState, StepProps } from "../../../../shared/interface/CreateProjectInterface"
import { toast } from "sonner";
import api from "lib/api";
import { ApiResponse, ErrorResponse } from "@shared/interface/ApiResponseInterface";

const CreateProjectPage: React.FC = () => {
  const { user } = useGlobalContext();
  const userId = user?._id || "";

  const [currentStep, setCurrentStep] = useState<number>(0);
  const [uniqueId, setUniqueId] = useState<string | null>(null);

  const [formData, setFormData] = useState<IProjectFormState>({
    user: userId,
    name: "",
    service: "",
    addOns: [],
    respondentCountry: "",
    respondentLanguage: [],
    sessions: [],
    firstDateOfStreaming: "", 
    projectDate: "", 
    respondentsPerSession: 0,
    numberOfSessions: 0,
    sessionLength: "",
    recruitmentSpecs: "",
    preWorkDetails: "",
    selectedLanguage: "",
    inLanguageHosting: "",
    provideInterpreter: "",
    languageSessionBreakdown: "",
    additionalInfo: "",
    emailSent: "",
  });

  const updateFormData = (fields: Partial<IProjectFormState>) => {
    setFormData((prev) => ({ ...prev, ...fields }));
  };

  // Dynamically compute which steps apply
  const steps = useMemo<React.FC<StepProps>[]>(() => {
    if (formData.service === "Signature") {
      return [Step1, Step3, Step4];
    }
    if (formData.service === "Concierge") {
      if (formData.firstDateOfStreaming) {
        const diffDays =
          (new Date(formData.firstDateOfStreaming).getTime() -
            Date.now()) /
          (1000 * 3600 * 24);
        if (diffDays < 14 || formData.addOns.length > 0) {
          return [Step1, Step2];
        }
        return [Step1, Step3, Step4];
      }
      return [Step1, Step2];
    }
    return [Step1];
  }, [formData.service, formData.firstDateOfStreaming, formData.addOns]);

  // Keep currentStep in range
  useEffect(() => {
    if (currentStep >= steps.length) {
      setCurrentStep(steps.length - 1);
    }
  }, [steps, currentStep]);

  const StepComponent = steps[currentStep];


  // const nextStep = () => setCurrentStep((prev) => prev + 1);
  const handleNext = () =>
    saveMutation.mutate({ uniqueId, formData, userId });

  const handleBack = () => setCurrentStep((prev) => Math.max(prev - 1, 0));

  const isNextButtonDisabled = () => {
    if (currentStep === 0) {
      return !formData.service || !formData.firstDateOfStreaming;
    }
    return false;
  };

  const saveMutation = useMutation<
    ApiResponse<{ uniqueId: string }>,
    AxiosError<ErrorResponse>,
    { uniqueId: string | null; formData: IProjectFormState; userId: string }
  >({
    mutationFn: (payload) =>
      api
        .post<ApiResponse<{ uniqueId: string }>>(
          "/api/v1/projects/save-progress",
          payload
        )
        .then((res) => res.data),
    onSuccess: (resp) => {
      if (resp.data.uniqueId) {
        setUniqueId(resp.data.uniqueId);
      }
      setCurrentStep((prev) => prev + 1);
    },
    onError: (err) => {
      const msg =
        axios.isAxiosError(err) && err.response?.data.message
          ? err.response.data.message
          : err.message;
      console.error("Error saving progress:", msg);
      toast.error(msg);
    },
  });

  const isLoading = saveMutation.isPending;

  

  return (
    <div className="min-h-screen p-6">
      <h1 className="text-3xl font-bold mb-4 text-center">Create Project</h1>
      <div className="mb-4 text-center">
        <p>
          Step {currentStep + 1} of {steps.length}
        </p>
      </div>

      {/* Dynamic Step Rendering */}
      <StepComponent
        formData={formData}
        updateFormData={updateFormData}
        uniqueId={uniqueId}
      />

      <div className="flex justify-between mt-6">
        <Button variant="outline" onClick={handleBack} disabled={currentStep === 0}>
          Back
        </Button>
        {/* Only show Next button if not on last step */}
  {!(formData.service === "Concierge" && currentStep === 1) &&
    !(formData.service === "Signature" && currentStep === 2) && (
      <Button
        onClick={handleNext}
        disabled={isNextButtonDisabled() || isLoading}
      >
        {isLoading ? "Saving..." : "Next"}
      </Button>
  )}
      </div>
    </div>
  );
};

export default CreateProjectPage;

```

### app/(dashboard)/edit-profile/[id]/page.tsx
```javascript
'use client'
import React, { useState, useEffect, ChangeEvent } from 'react'

import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import { FaSave } from 'react-icons/fa'
import { toast } from 'sonner'
import { useGlobalContext } from 'context/GlobalContext'
import { Button } from 'components/ui/button'
import InputFieldComponent from 'components/InputFieldComponent'
import { EditUser, IUser } from '@shared/interface/UserInterface'
import { useMutation, useQuery } from '@tanstack/react-query'
import { ApiResponse, ErrorResponse } from '@shared/interface/ApiResponseInterface'
import api from 'lib/api'

const Page: React.FC = () => {
  const { id } = useParams() as { id: string }
  const router = useRouter()
  const { setUser: setGlobalUser } = useGlobalContext()

   const [formState, setFormState] = useState<EditUser>({
    firstName: '',
    lastName: '',
    email: '',
  })

    // 1️⃣ Load the user data
    const {
      data: fullUser,
      isLoading,
      isError,
      error,
    } = useQuery<IUser, ErrorResponse>({
      queryKey: ['user', id],
      queryFn: () =>
        api
          .get<ApiResponse<IUser>>('/api/v1/users/find-by-id', { params: { id } })
          .then(res => res.data.data),
    })

    useEffect(() => {
      if (fullUser) {
        setFormState({
          firstName: fullUser.firstName,
          lastName: fullUser.lastName,
          email: fullUser.email,
        })
      }
    }, [fullUser])

  

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormState(prev => ({ ...prev, [name]: value }))
  }

  const updateMutation = useMutation<IUser, ErrorResponse, EditUser>({
    
    mutationFn: (updatedFields: EditUser) =>
      api
        .put<ApiResponse<IUser>>(`/api/v1/users/edit/${id}`, updatedFields)
        .then(res => res.data.data),

    onSuccess: (updatedUser: IUser) => {
      setGlobalUser(updatedUser)
      localStorage.setItem('user', JSON.stringify(updatedUser))
      toast.success('Profile updated successfully')
      router.push(`/my-profile/${id}`)
    },

    onError: (err: ErrorResponse) => {
      console.error('Error updating profile:', err)
      toast.error(err.message || 'Failed to update profile')
    },
  })



  const handleSave = () => {
    updateMutation.mutate(formState)
  }

  if (isLoading) return <p className="px-6 py-4">Loading profile…</p>

  if (isError) {
    console.error('Error fetching user:', error)
    return <p className="px-6 py-4 text-red-500">{error?.message || 'Failed to load profile'}</p>
  }

  

  return (
    <div className='my_profile_main_section_shadow pb-16 bg-[#fafafb] bg-opacity-90 h-full min-h-screen flex flex-col items-center'>
      {/* navbar */}
      <div className='bg-white h-20 w-full'>
        <div className='px-10 flex justify-between items-center pt-3'>
          <div className='flex justify-center items-center w-full'>
            <p className='text-2xl font-bold text-[#1E656D] text-center'>
              Edit Profile
            </p>
          </div>
          <div className=' justify-center items-center gap-4 hidden md:flex'>
            <Button
              type='button'
              variant='teal'
              onClick={handleSave}
              disabled={updateMutation.isPending}
              className='rounded-xl w-[100px] text-center py-6 shadow-[0px_3px_6px_#2976a54d]'
            >
              <FaSave />
             {updateMutation.isPending ? 'Saving…' : 'Save'}
            </Button>
          </div>
          <div className='flex justify-center items-center gap-4 md:hidden fixed right-5'>
            <Button
              type='button'
              variant='teal'
              onClick={handleSave}
              disabled={updateMutation.isPending}
              className='rounded-xl w-full text-center py-6 shadow-[0px_3px_6px_#FF66004D] '
            >
              <FaSave />
            </Button>
          </div>
        </div>
      </div>

      {/* body */}
      <div className='w-full md:w-[450px] px-5 md:px-0 md:ml-6 md:mr-auto'>
        <div className='pt-8 w-full'>
          <div className='flex justify-start items-center gap-8 flex-col md:flex-row'>
            <Image
              src='/placeholder-image.png'
              alt='user image'
              height={70}
              width={70}
              className='rounded-full'
            />
            <div className='flex-grow'>
              <h1 className='text-3xl font-semibold text-[#1E656D] text-center md:text-left'>
              {formState.firstName} {formState.lastName}
              </h1>
              <p className='text-center text-gray-400 md:text-left'>
              {formState.role}
              </p>
            </div>
          </div>

          {/* personal details */}
          <div>
            <h1 className='text-2xl font-semibold text-[#00293C] pt-7 md:text-left'>
              Personal Details
            </h1>
            <div className='space-y-7 pt-0 md:pt-7 mt-5'>
              <InputFieldComponent
                label='First Name'
                name='firstName'
                value={formState?.firstName}
                onChange={handleInputChange}
              />
              <InputFieldComponent
                label='Last Name'
                name='lastName'
                value={formState?.lastName}
                onChange={handleInputChange}
              />
              <InputFieldComponent
                label='Email'
                name='email'
                value={formState?.email}
                onChange={handleInputChange}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Page

```

### app/(dashboard)/my-profile/[id]/page.tsx
```javascript
"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "components/ui/button";
import PasswordModalComponent from "components/PasswordModalComponent";
import ConfirmationModalComponent from "components/ConfirmationModalComponent";
import { useGlobalContext } from "context/GlobalContext";
import { RiPencilFill } from "react-icons/ri";
import { IoTrashSharp } from "react-icons/io5";
import { MdLockReset } from "react-icons/md";
import HeadingParagraphComponent from "components/HeadingParagraphComponent";
import { useMutation } from "@tanstack/react-query";
import {
  ApiResponse,
  ErrorResponse,
} from "@shared/interface/ApiResponseInterface";
import api from "lib/api";

const Page = () => {
  const { user, setUser } = useGlobalContext();
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // 🔄 Mutation: delete user account
  const deleteUserMutation = useMutation<void, ErrorResponse, string>({
    mutationFn: (userId) =>
      api
        .delete<ApiResponse<void>>(`/api/v1/users/${userId}`)
        .then((res) => res.data.data),
    onSuccess: () => {
      toast.success("Account deleted");
      setUser(null);
      router.push("/login");
    },
    onError: (err) => {
      toast.error(err.message || "Failed to delete account");
    },
  });

  return (
    <>
      {/* Desktop View */}
      <div className="hidden md:flex my_profile_main_section_shadow bg-[#fafafb] bg-opacity-90 h-full min-h-screen  flex-col justify-center items-center relative">
        <div className="bg-white h-16 w-full px-10 flex justify-between items-center pt-2">
          <p className="text-2xl font-bold text-custom-teal">My Profiles</p>
        </div>

        <div className="flex-grow w-full px-10 pt-14">
          <div className="flex gap-4 items-center">
            <Image
              src="/placeholder-image.png"
              alt="user image"
              height={50}
              width={70}
              className="rounded-full"
            />
            <div className="flex-grow">
              <h1 className="text-3xl font-semibold text-custom-dark-blue-1">
                {user ? user.firstName?.toUpperCase() : "Loading..."}
              </h1>
              <p>{user ? user.role?.toUpperCase() : "Loading..."}</p>
            </div>
          </div>

          <h1 className="text-2xl font-semibold text-custom-dark-blue-1 pt-7">
            Personal Details
          </h1>
          <div className="space-y-2 pt-7">
            <div className="flex justify-start items-center gap-10">
              <HeadingParagraphComponent
                heading="First Name"
                paragraph={user ? user?.firstName?.toUpperCase() : "Loading..."}
              />
              <HeadingParagraphComponent
                heading="Last Name"
                paragraph={user ? user?.lastName?.toUpperCase() : "Loading..."}
              />
            </div>
            <div className="flex justify-start items-center gap-10">
              <HeadingParagraphComponent
                heading="Email"
                paragraph={user ? user?.email : "Loading..."}
              />
              <HeadingParagraphComponent
                heading="Remaining Credits"
                paragraph={`${user ? user?.credits ?? 0 : "Loading..."}`}
              />
            </div>
            <div className="flex justify-start items-center gap-10">
              <HeadingParagraphComponent
                heading="Phone Number"
                paragraph={user ? user?.phoneNumber : "Loading..."}
              />
              <HeadingParagraphComponent
                heading="Company Name"
                paragraph={`${user ? user?.companyName  : "Loading..."}`}
              />
            </div>
            {user?.billingInfo && (
              <div className="space-y-2 pt-2">
                <div className="flex justify-start items-center gap-10">
                  <HeadingParagraphComponent
                    heading="Address"
                    paragraph={user ? user?.billingInfo?.address : "Loading..."}
                  />
                  <HeadingParagraphComponent
                    heading="City"
                    paragraph={`${
                      user ? user?.billingInfo?.city : "Loading..."
                    }`}
                  />
                </div>

                <div className="flex justify-start items-center gap-10">
                  <HeadingParagraphComponent
                    heading="State"
                    paragraph={user ? user?.billingInfo?.state : "Loading..."}
                  />
                  <HeadingParagraphComponent
                    heading="Postal Code"
                    paragraph={`${
                      user ? user?.billingInfo?.postalCode : "Loading..."
                    }`}
                  />
                </div>
                <div className="flex justify-start items-center gap-10">
                  <HeadingParagraphComponent
                    heading="Country"
                    paragraph={user ? user?.billingInfo?.country : "Loading..."}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="flex gap-4 justify-end items-center pb-10 w-full px-10">
          <Link href={`/edit-profile/${id}`}>
            <Button
              type="button"
              variant="teal"
              className="rounded-xl w-[200px] text-center py-6 shadow-[0px_3px_6px_#2976a54d]"
            >
              <RiPencilFill />
              Edit Profile
            </Button>
          </Link>
          <Button
            type="button"
            variant="dark-blue"
            onClick={() => setShowPasswordModal(true)}
            className="rounded-xl w-[200px] text-center py-6 shadow-[0px_3px_6px_#2976a54d]"
          >
            <MdLockReset />
            Change Password
          </Button>
          <Button
            type="button"
            variant="orange"
            onClick={() => setShowDeleteModal(true)}
            disabled={deleteUserMutation.isPending}
            className="rounded-xl w-[200px] text-center py-6 shadow-[0px_3px_6px_#FF66004D] "
          >
            {deleteUserMutation.isPending ? (
              "Deleting…"
            ) : (
              <>
                <IoTrashSharp /> Delete Account
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Mobile View */}
      <div className="md:hidden my_profile_main_section_shadow bg-[#fafafb] bg-opacity-90 h-full min-h-screen flex flex-col justify-start items-center p-5 relative">
        <div className="w-full flex justify-between items-center absolute top-0 left-0 px-5 pt-5">
          <p className="text-xl md:text-2xl font-bold text-custom-teal text-center flex-grow">
            My Profile
          </p>
          <div className="flex items-center justify-center">
            <Link href={`/edit-profile/${id}`}>
              <Button type="button" variant="teal" className="">
                <RiPencilFill />
              </Button>
            </Link>
          </div>
        </div>

        <div className="flex-grow w-full">
          <div className="pt-16">
            <div className="flex flex-col md:flex-row justify-start items-center gap-4">
              <Image
                src="/placeholder-image.png"
                alt="user image"
                height={60}
                width={70}
                className="rounded-full"
              />
              <div className="flex-grow items-center justify-center">
                <h1 className="text-3xl md:text-3xl font-semibold text-center text-custom-teal">
                  {user ? user?.firstName?.toUpperCase() : "Loading..."}
                </h1>
                <p className="text-sm text-center text-gray-400">
                  {user ? user?.role?.toUpperCase() : "Loading..."}
                </p>
              </div>
            </div>

            <div>
              <h1 className="text-xl md:text-2xl font-semibold text-custom-dark-blue-1 pt-10">
                Personal Details
              </h1>
              <div className="space-y-2 pt-3">
                <HeadingParagraphComponent
                  heading="First Name"
                  paragraph={
                    user ? user?.firstName?.toUpperCase() : "Loading..."
                  }
                />
                <HeadingParagraphComponent
                  heading="Last Name"
                  paragraph={
                    user ? user?.lastName?.toUpperCase() : "Loading..."
                  }
                />

                <HeadingParagraphComponent
                  heading="Email"
                  paragraph={user ? user?.email : "Loading..."}
                />
                <HeadingParagraphComponent
                  heading="Remaining Credits"
                  paragraph={`${user ? user?.credits ?? 0 : "Loading..."}`}
                />
                <HeadingParagraphComponent
                  heading="Phone Number"
                  paragraph={user ? user?.phoneNumber : "Loading..."}
                />
                <HeadingParagraphComponent
                  heading="Company Name"
                  paragraph={`${user ? user?.companyName  : "Loading..."}`}
                />

                {user?.billingInfo && (
                  <div className="space-y-2 pt-3">
                    <HeadingParagraphComponent
                      heading="Address"
                      paragraph={
                        user ? user?.billingInfo?.address : "Loading..."
                      }
                    />
                    <HeadingParagraphComponent
                      heading="City"
                      paragraph={`${
                        user ? user?.billingInfo?.city : "Loading..."
                      }`}
                    />

                    <HeadingParagraphComponent
                      heading="State"
                      paragraph={user ? user?.billingInfo?.state : "Loading..."}
                    />
                    <HeadingParagraphComponent
                      heading="Postal Code"
                      paragraph={`${
                        user ? user?.billingInfo?.postalCode : "Loading..."
                      }`}
                    />

                    <HeadingParagraphComponent
                      heading="Country"
                      paragraph={
                        user ? user?.billingInfo?.country : "Loading..."
                      }
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white w-full pb-5 relative mt-5">
          {" "}
          {/* Added margin-top to push content below the header */}
          <div className="flex flex-col md:flex-row justify-between items-center pt-5">
            <div className="flex flex-col md:flex-row justify-center items-center gap-4 mt-5 md:mt-0 relative w-full">
              <Button
                type="button"
                variant="dark-blue"
                onClick={() => setShowPasswordModal(true)}
                className="rounded-xl w-full text-center py-6 shadow-[0px_3px_6px_#2976a54d]"
              >
                <MdLockReset />
                Change Password
              </Button>
              <Button
                type="button"
                variant="orange"
                onClick={() => setShowDeleteModal(true)}
                disabled={deleteUserMutation.isPending}
                className="rounded-xl w-full text-center py-6 shadow-[0px_3px_6px_#FF66004D] "
              >
                {deleteUserMutation.isPending ? (
                  "Deleting…"
                ) : (
                  <>
                    <IoTrashSharp /> Delete Account
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <PasswordModalComponent
        open={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        id={id}
      />
      <ConfirmationModalComponent
        open={showDeleteModal}
        onCancel={() => setShowDeleteModal(false)}
        onYes={() => deleteUserMutation.mutate(id!)}
        heading="Delete Account"
        text="Are you sure you want to delete your account? All your data will be permanently deleted. This action cannot be undone."
      />
    </>
  );
};

export default Page;

```

### app/(dashboard)/projects/[projectId]/observer-documents/page.tsx
```javascript
'use client'

import { useQuery } from '@tanstack/react-query'
import api from 'lib/api'
import { useParams } from 'next/navigation'
import React from 'react'
import {IObserverDocument} from "@shared/interface/ObserverDocumentInterface"

const ObserverDocuments = () => {
  const { projectId } = useParams()

  const { data: observerDocuments, isLoading, error } = useQuery<IObserverDocument[], Error>({
    queryKey: ['observerDocs', projectId],
    queryFn: () =>
      api
        .get(`/api/v1/observerDocuments/project/${projectId}`)
        .then((res) => res.data.data),
    enabled: Boolean(projectId),
  })

  console.log("observerDocuments", observerDocuments)
  
  if (isLoading) return <p>Loading observer documents…</p>
  if (error) return <p className="text-red-500">Error: {error.message}</p>


  return (
    <div>ObserverDocuments</div>
  )
}

export default ObserverDocuments
```

### app/(dashboard)/projects/[projectId]/polls/page.tsx
```javascript
'use client'

import { useQuery } from '@tanstack/react-query'
import api from 'lib/api'
import { useParams } from 'next/navigation'
import React from 'react'
import {IPoll} from "@shared/interface/PollInterface"

const Polls = () => {
  const { projectId } = useParams()

  const { data: polls, isLoading, error } = useQuery<IPoll[], Error>({
    queryKey: ['polls', projectId],
    queryFn: () =>
      api.get(`/api/v1/polls/project/${projectId}`).then((res) => res.data.data),
    enabled: Boolean(projectId),
  })

console.log("polls", polls)

  if (isLoading) return <p>Loading polls…</p>
  if (error) return <p className="text-red-500">Error: {error.message}</p>


  return (
    <div>Polls</div>
  )
}

export default Polls
```

### app/(dashboard)/projects/[projectId]/project-team/page.tsx
```javascript
'use client'

import { useQuery } from '@tanstack/react-query'
import api from 'lib/api'
import { useParams } from 'next/navigation'
import React from 'react'
import {IModerator} from "@shared/interface/ModeratorInterface"


const ProjectTeam = () => {
  const { projectId } = useParams()

  const { data: projectTeam, isLoading, error } = useQuery<IModerator[], Error>({
    queryKey: ['projectTeam', projectId],
    queryFn: () =>
      api
        .get(`/api/v1/moderators/project/${projectId}`)
        .then((res) => res.data.data),
    enabled: Boolean(projectId),
  })

  console.log("projectTeam", projectTeam)

  if (isLoading) return <p>Loading project team…</p>
  
  if (error) return <p className="text-red-500">Error: {error.message}</p>

  return (
    <div>ProjectTeam</div>
  )
}

export default ProjectTeam
```

### app/(dashboard)/projects/[projectId]/session-deliverables/page.tsx
```javascript
'use client'

import { useQuery } from '@tanstack/react-query'
import api from 'lib/api'
import { useParams } from 'next/navigation'
import React from 'react'
import {ISessionDeliverable} from "@shared/interface/SessionDeliverableInterface"

const SessionDeliverables = () => {
  const { projectId } = useParams()

  const { data: sessionDeliverables, isLoading, error } = useQuery<ISessionDeliverable[], Error>({
    queryKey: ['sessionDeliverables', projectId],
    queryFn: () =>
      api
        .get(
          `/api/v1/sessionDeliverables/project/${projectId}?type=TRANSCRIPT`
        )
        .then((res) => res.data.data),
    enabled: Boolean(projectId),
  })

  console.log("sessionDeliverables", sessionDeliverables)

  if (isLoading) return <p>Loading session deliverables…</p>
  if (error) return <p className="text-red-500">Error: {error.message}</p>

  return (
    <div>SessionDeliverables</div>
  )
}

export default SessionDeliverables
```

### app/(dashboard)/projects/[projectId]/sessions/page.tsx
```javascript
'use client'

import { useQuery } from '@tanstack/react-query'
import api from 'lib/api'
import { useParams } from 'next/navigation'
import React from 'react'
import {ISession} from "@shared/interface/SessionInterface"

const Sessions = () => {
  const { projectId } = useParams()

  const { data: sessions, isLoading, error } = useQuery<ISession[], Error>({
    queryKey: ['sessions', projectId],
    queryFn: () =>
      api
        .get(`/api/v1/sessions/project/${projectId}`)
        .then((res) => res.data.data),
    enabled: Boolean(projectId),
  })

  console.log('Sessions', sessions)

  if (isLoading) return <p>Loading sessions…</p>
  if (error) return <p className="text-red-500">Error: {error.message}</p>

  return (
    <div>Sessions</div>
  )
}

export default Sessions
```

### app/(dashboard)/projects/[projectId]/layout.tsx
```javascript
'use client'

import { ReactNode } from 'react'
import { useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import api from 'lib/api'
import { IProject } from '@shared/interface/ProjectInterface'

export default function ProjectLayout({ children }: { children: ReactNode }) {
  const { projectId } = useParams()

  const { data: project, isLoading } = useQuery<IProject, Error>({
    queryKey: ['project', projectId],
    queryFn: () =>
      api
        .get(`/api/v1/projects/${projectId}`)
        .then((res) => res.data.data),
    enabled: Boolean(projectId),
  })


  return (
    <div className="px-6 py-4">
      {isLoading ? (
        <h1 className="text-xl font-semibold">Loading…</h1>
      ) : (
        <h1 className="text-2xl font-bold">{project?.name}</h1>
      )}

      {/* this is where Sessions / Polls / Reports pages will render */}
      <div className="mt-6">{children}</div>
    </div>
  )
}

```

### app/(dashboard)/projects/[projectId]/page.tsx
```javascript
'use client'

import { useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { IProject } from '@shared/interface/ProjectInterface'
import api from 'lib/api'


export default function ProjectOverviewPage() {
  const { projectId } = useParams()
  const { data: project, isLoading, error } = useQuery<IProject, Error>({
    queryKey: ['project', projectId],
    queryFn: () =>
      api
        .get(`/api/v1/projects/get-project-by-id/${projectId}`)
        .then((res) => res.data.data),
    enabled: Boolean(projectId),
  })


  if (isLoading) return <p>Loading project overview…</p>
  if (error) return <p className="text-red-500">Failed to load project.</p>

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">About this project</h2>
      <p>{project?.name || 'No description provided.'}</p>
      {/* …more overview content here (stats, dates, etc.)… */}
    </div>
  )
}

```

### app/(dashboard)/projects/page.tsx
```javascript
"use client"
import React, { useEffect } from 'react';
import Link from 'next/link';
import { Button } from 'components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { useGlobalContext } from 'context/GlobalContext';
import api from 'lib/api';
import { IProject } from '@shared/interface/ProjectInterface';
import axios from 'axios';



const Projects: React.FC = () => {
 const { user } = useGlobalContext()

 const userId = user?._id;

  const { data: projects, error, isLoading } = useQuery<IProject[]>({
    queryKey: ['projects', userId],
    queryFn: async () => {
      // Adjust the endpoint as necessary.
      const response = await api.get(`${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/api/v1/projects/get-project-by-userId/${userId}`);
      
      return response.data.data;
    },
    enabled: Boolean(userId),
    staleTime: 1000 * 60 * 5, // cache for 5 minutes
  });

  useEffect(() => {
    console.log('Fetched projects:', projects);
  }, [projects]);

    // If no user exists, you might choose to render a message or redirect
    if (!userId) {
      return <p>User not found or not authenticated.</p>;
    }

  if (isLoading) {
    return <p>Loading projects...</p>;
  }

  if (error) {
   
    let message: string;
    if (axios.isAxiosError(error)) {
      // server error shape: { success: false, message: string }
      message = error.response?.data?.message ?? error.message;
    } else {
      // fallback for non-Axios errors
      message = (error as Error).message || "Unknown error";
    }
    return (
      <p className="p-6 text-red-600">
        Error loading projects: {message}
      </p>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Projects</h1>

      {projects && projects.length > 0 ? (
        <ul className="space-y-2">
          {projects.map((project) => (
            <li key={project._id} className="border-b pb-2">
              <Link
                href={`/projects/${project._id}`}
                className="text-blue-600 hover:underline"
              >
                {project.name}
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p>No projects found.</p>
      )}

      <div className="mt-6">
        <Link href="/create-project" passHref>
          <Button>Create New Project</Button>
        </Link>
      </div>
    </div>
  );
};


export default Projects;

```

### app/(dashboard)/layout.tsx
```javascript
'use client'
import React, { ReactNode, useEffect, useState } from 'react'
import { useGlobalContext } from '../../context/GlobalContext'
import { useRouter } from 'next/navigation'
import FooterComponent from 'components/FooterComponent'
import DashboardSidebarComponent from '../../components/DashboardSidebarComponent'
import LogoutModalComponent from 'components/LogoutModalComponent'

interface DashboardLayoutProps {
  children: ReactNode
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false)
  const { user } = useGlobalContext()
  const router = useRouter()

  const handleLogoutModalOpen = () => {
    setIsLogoutModalOpen(!isLogoutModalOpen)
  }

  const handleCloseLogoutModal = () => {
    setIsLogoutModalOpen(false)
  }

  useEffect(() => {
    if (!user || Object.keys(user).length === 0) {
      router.push('/login')
    }
  }, [user, router])

  return (
    <div className='min-h-screen flex flex-col h-full'>
      {/* upper layout */}
      <div className='flex-grow h-full flex relative'>
        <div className='sticky top-0 md:w-[260px] h-screen z-10'>
          <DashboardSidebarComponent
            handleLogoutModalOpen={handleLogoutModalOpen}
            isLogoutModalOpen={isLogoutModalOpen}
            
          />
        </div>
        <div className='overflow-x-hidden flex-grow h-full'>{children}</div>
      </div>

      {/* logout modal */}
      {isLogoutModalOpen && (
        <LogoutModalComponent
          open={isLogoutModalOpen}
          onClose={handleCloseLogoutModal}
        />
      )}

      {/* footer */}
      <FooterComponent />
    </div>
  )
}
export default DashboardLayout

```

### app/layout.tsx
```javascript
import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import Providers from 'provider/Providers'
import TanstackProvider from 'provider/TanstackProvider'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Create Next App',
  description: 'Generated by create next app',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang='en' suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <TanstackProvider>
          <Providers>{children}</Providers>
        </TanstackProvider>
      </body>
    </html>
  )
}

```

### app/page.tsx
```javascript
import HeadingBlue25px from "components/HeadingBlue25pxComponent";
import { Button } from "components/ui/button";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col justify-center items-center min-h-screen meeting_bg space-y-5">
      <HeadingBlue25px>Welcome to Amplify Research</HeadingBlue25px>

      <Link href="/login">
        <Button variant="default" className="bg-[#FC6E15] hover:bg-[#FC65E15]">
          Login
        </Button>
      </Link>

      <Link href="/create-user">
        <Button variant="default" className="bg-[#FC6E15] hover:bg-[#FC65E15]">
          Register
        </Button>
      </Link>
    </div>
  );
}

```
### components/projects/createProject/BillingFormComponent
```javascript
// /components/BillingForm.tsx
"use client";
import React, { useState } from "react";
import { Button } from "components/ui/button";
import { Label } from "components/ui/label";
import axios, { AxiosError } from "axios";
import { toast } from "sonner";

import { IBillingInfo } from "@shared/interface/UserInterface";
import { BillingFormProps } from "@shared/interface/CreateProjectInterface";
import { useGlobalContext } from "context/GlobalContext";
import { Input } from "components/ui/input";
import { useMutation } from "@tanstack/react-query";
import { ApiResponse, ErrorResponse } from "@shared/interface/ApiResponseInterface";
import api from "lib/api";

export const BillingForm: React.FC<BillingFormProps> = ({ onSuccess }) => {
  const { user } = useGlobalContext();
  const [billingInfo, setBillingInfo] = useState<IBillingInfo>({
    address: "",
    city: "",
    state: "",
    country: "",
    postalCode: "",
  });

 
  const saveBilling = useMutation<
  ApiResponse<null>,
  AxiosError<ErrorResponse>,
  IBillingInfo
>({
  mutationFn: (info) =>
    api
      .post<ApiResponse<null>>(
        "/api/v1/payment/save-billing-info",
        { userId: user?._id, billingInfo: info }
      )
      .then((res) => res.data),

  onSuccess: () => {
    toast.success("Billing info saved successfully");
    onSuccess();
  },

  onError: (err) => {
    const msg = axios.isAxiosError(err)
      ? err.response?.data?.message ?? err.message
      : "Error saving billing info";
    toast.error(msg);
  },
});

  const handleChange = (key: keyof IBillingInfo, value: string) => {
    setBillingInfo((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveBilling.mutate(billingInfo);
  };

  return (
   
    <form
      onSubmit={handleSubmit}
      className="space-y-4 border p-4 rounded-md"
    >
      <h2 className="text-lg font-semibold">Billing Information</h2>

      {(
        ["address", "city", "state", "country", "postalCode"] as Array<
          keyof IBillingInfo
        >
      ).map((field) => (
        <div key={field} className="flex flex-col">
          <Label className="mb-1 capitalize">{field.replace(/([A-Z])/g, " $1")}</Label>
          <Input
            value={billingInfo[field]}
            onChange={(e) => handleChange(field, e.target.value)}
            required
          />
        </div>
      ))}

      <Button type="submit" disabled={saveBilling.isPending} className="mt-2">
        {saveBilling.isPending ? "Saving..." : "Save Billing Info"}
      </Button>
    </form>
  );
};

export default BillingForm;

```

### components/projects/createProject/CardSetupFormComponent.tsx
```javascript
// /components/CardSetupForm.tsx
"use client";
import React from "react";
import { toast } from "sonner";
import { Button } from "components/ui/button";
import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { CardSetupFormProps } from "@shared/interface/CreateProjectInterface";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiResponse, ErrorResponse } from "@shared/interface/ApiResponseInterface";
import { useGlobalContext } from "context/GlobalContext";
import api from "lib/api";
import { IUser } from "@shared/interface/UserInterface";



export const CardSetupForm: React.FC<CardSetupFormProps> = ({
  onCardSaved,
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const { user, setUser } = useGlobalContext();
  
  const qc = useQueryClient();

  
    // 1️⃣ Fetch Setup Intent
    const { data: clientSecret, isLoading: loadingSecret } = useQuery<
    string,
    ErrorResponse
  >({
    queryKey: ["stripeSetupIntent", user?._id],
    queryFn: async () => {
      if (!user || !user._id) throw new Error("Not authenticated");
      const res = await api.post<ApiResponse<{ clientSecret: string }>>(
        "/api/v1/payment/create-setup-intent",
        { userId: user._id }
      );
      return res.data.data.clientSecret;
    },
    enabled: Boolean(user?._id),
  });

  // 2️⃣ Save the payment method to your backend
  const saveCardMutation = useMutation<
    IUser,
    ErrorResponse,
    string
  >({
    mutationFn: async (paymentMethodId) => {
      if (!user) throw new Error("Not authenticated");
      const res = await api.post<ApiResponse<{ user: IUser }>>(
        "/api/v1/payment/save-payment-method",
        {
          customerId: user.stripeCustomerId!,
          paymentMethodId,
        }
      );
      return res.data.data.user;
    },
    onSuccess: (newUser) => {
      // update global user and invalidate the intent so we don't reuse it
      setUser(newUser);
      qc.invalidateQueries({ queryKey: ["stripeSetupIntent", user!._id] });

      toast.success("Card saved successfully");
      onCardSaved();
    },
    onError: (err) => {
      toast.error(err.message || "Error saving card");
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements || !clientSecret) return;

    const cardEl = elements.getElement(CardElement);
    if (!cardEl) return;

    // Confirm setup intent with Stripe.js
    const { error, setupIntent } = await stripe.confirmCardSetup(
      clientSecret,
      { payment_method: { card: cardEl } }
    );
    if (error) {
      toast.error(error.message || "Error during card setup");
      return;
    }

    // Extract the payment method ID
    const pmField = setupIntent.payment_method;
    const pmId =
      typeof pmField === "string" ? pmField : pmField?.id;
    if (!pmId) {
      toast.error("Unable to retrieve payment method ID");
      return;
    }

    // Kick off the backend mutation
    saveCardMutation.mutate(pmId);
  };

  if (loadingSecret) {
    return <p>Loading payment form…</p>;
  }

  

  return (
    <form
    onSubmit={handleSubmit}
    className="space-y-4 border p-4 rounded-md"
  >
    <h2 className="text-lg font-semibold">Enter Card Details</h2>

    <div className="border p-4 rounded-md">
      <CardElement
        options={{
          style: {
            base: {
              fontSize: "16px",
              color: "#32325d",
              "::placeholder": { color: "#aab7c4" },
            },
          },
        }}
      />
    </div>

    <Button
      type="submit"
      disabled={!stripe || saveCardMutation.isPending}
    >
      {saveCardMutation.isPending
        ? "Saving Card..."
        : "Save Card & Pay"}
    </Button>
  </form>
    
  );
};

export default CardSetupForm;

```

### components/projects/createProject/PaymentIntegrationComponent.tsx
```javascript
// /components/PaymentIntegration.tsx
"use client";
import React, { useState } from "react";
import { Elements } from "@stripe/react-stripe-js";
import { Button } from "components/ui/button";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { loadStripe } from "@stripe/stripe-js";
import CardSetupForm from "./CardSetupFormComponent";
import BillingForm from "./BillingFormComponent";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { IProject } from "@shared/interface/ProjectInterface";
import {
  IProjectFormState,
  PaymentIntegrationProps,
} from "@shared/interface/CreateProjectInterface";
import { useGlobalContext } from "context/GlobalContext";
import api from "lib/api";
import { ApiResponse } from "@shared/interface/ApiResponseInterface";
import { IUser } from "@shared/interface/UserInterface";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ""
);

export const PaymentIntegration: React.FC<PaymentIntegrationProps> = ({
  totalPurchasePrice,
  totalCreditsNeeded,
  projectData,
  uniqueId,
}) => {
  const { user, setUser } = useGlobalContext();
  const router = useRouter();

  const [isChangingCard, setIsChangingCard] = useState(false);
  const [chargeLoading, setChargeLoading] = useState(false);

  // 1️⃣ A helper to re-fetch the logged-in user's profile
  const refetchUser = async () => {
    const resp = await api.get<ApiResponse<{ user: IUser }>>(
      "/api/v1/users/me"
    );

    const fresh = resp.data.data.user;
    setUser(fresh);
    // ADD THIS:
    if (typeof window !== "undefined") {
      localStorage.setItem("user", JSON.stringify(fresh));
    }
  };

  // 1️⃣ Mutation to charge saved card
  const chargeMutation = useMutation<
    // TData
    { data: { user: typeof user } },
    // TError
    unknown,
    // TVariables
    { amount: number; credits: number; userId: string; customerId: string }
  >({
    mutationFn: ({ amount, credits, customerId, userId }) =>
      api
        .post<ApiResponse<{ user: IUser }>>("/api/v1/payment/charge", {
          customerId,
          amount,
          currency: "usd",
          userId,
          purchasedCredit: credits,
        })
        .then((res) => res.data),
    onSuccess: (apiResp) => {
      const updatedUser = apiResp.data.user;
      // persist and update context
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setUser(updatedUser);
      toast.success("Payment successful");
      // now create project
      createProjectMutation.mutate();
    },
    onError: (err) => {
      toast.error(
        axios.isAxiosError(err)
          ? err.response?.data?.message || "Payment failed"
          : "Payment failed"
      );
    },
  });
  // Mutation to hit create-project-by-external-admin endpoint
  const createProjectMutation = useMutation({
    mutationFn: () =>
      api.post("/api/v1/projects/create-project-by-external-admin", {
        userId: user?._id,
        uniqueId,
        projectData: formatProjectData(projectData as IProjectFormState),
        totalPurchasePrice,
        totalCreditsNeeded,
      }),
    onSuccess: () => {
      toast.success("Project created successfully!");
      router.push("/projects");
    },
    onError: (err) => {
      toast.error(
        axios.isAxiosError(err)
          ? err.response?.data?.message || "Project creation failed"
          : "Project creation failed"
      );
    },
  });

  if (!user) return <div className="text-red-500">User not found</div>;

  // Function to format raw form data into the payload format expected by the backend
  const formatProjectData = (rawData: IProjectFormState): Partial<IProject> => {
    return {
      name: rawData.name,
      description: "",
      startDate: new Date(rawData.firstDateOfStreaming),
      service: rawData.service as "Concierge" | "Signature",
      respondentCountry: rawData.respondentCountry,
      respondentLanguage: Array.isArray(rawData.respondentLanguage)
        ? rawData.respondentLanguage.join(", ")
        : rawData.respondentLanguage,
      sessions: rawData.sessions.map((session) => ({
        number: session.number,
        duration: session.duration,
      })),
      cumulativeMinutes: 0,
      status: "Draft",
      tags: [],
    };
  };

  const handleUseSavedCard = async () => {
    setChargeLoading(true);

    const amountCents = Math.round(totalPurchasePrice * 100);
    console.log("Charging amount (cents):", amountCents);
    if (!user.stripeCustomerId) {
      return toast.error("No Stripe customer ID available");
    }

    chargeMutation.mutate({
      amount: amountCents,
      credits: totalCreditsNeeded,
      customerId: user.stripeCustomerId,
      userId: user._id!,
    });
  };

  const hasBilling = Boolean(user.billingInfo);
  const hasCard = Boolean(user.creditCardInfo?.last4);

  return (
    <div className="space-y-6 p-6">
      <h2 className="text-2xl font-bold">Payment Integration</h2>
      {/* Billing Form */}
      {!hasBilling && (
        <div>
          <p className="mb-4">We need your billing information first.</p>
          <BillingForm onSuccess={refetchUser} />
        </div>
      )}
      {/* Card Setup Form */}
      {hasBilling && (!hasCard || isChangingCard) && (
        <CardSetupForm onCardSaved={() => setIsChangingCard(false)} />
      )}
      {/* Saved Card Display */}
      {hasBilling && hasCard && !isChangingCard && (
        <div className="space-y-4 border p-4 rounded-md">
          <p>
            Your saved card ending in{" "}
            <span className="font-medium">{user.creditCardInfo?.last4}</span> is
            on file.
          </p>
          <div className="flex space-x-4">
            <Button onClick={handleUseSavedCard} disabled={chargeLoading}>
              {chargeLoading ? "Processing..." : "Use this Card"}
            </Button>
            <Button variant="outline" onClick={() => setIsChangingCard(true)}>
              Change Card
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

// Wrap PaymentIntegration with Stripe Elements
const PaymentIntegrationWrapper: React.FC<PaymentIntegrationProps> = (
  props
) => (
  <Elements stripe={stripePromise}>
    <PaymentIntegration {...props} />
  </Elements>
);

export default PaymentIntegrationWrapper;

```

### components/projects/createProject/Step1Component.tsx
```javascript
"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "components/ui/card";
import { Input } from "components/ui/input";
import { Step1Props } from "@shared/interface/CreateProjectInterface";




const optionalAddOnServices = [
  "Top-Notch Recruiting",
  "Insight-Driven Moderation and Project Design",
  "Multi-Language Services",
  "Asynchronous Activities (Pretasks, Bulletin Boards, etc.)",
];

const Step1: React.FC<Step1Props> = ({ formData, updateFormData }) => {
  // Update the selected service tier
  const handleCardSelect = (tier: "Signature" | "Concierge") => {
    updateFormData({ service: tier });
  };

  // Update the first date of streaming when the date input changes
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const dateValue = e.target.value;
    updateFormData({ firstDateOfStreaming: dateValue });
  };

  // Toggle add-on checkbox selection
  const handleCheckboxChange = (service: string) => {
    let addOns = formData.addOns || [];
    if (addOns.includes(service)) {
      addOns = addOns.filter((s) => s !== service);
    } else {
      addOns = [...addOns, service];
    }
    updateFormData({ addOns });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:space-x-4 space-y-4 md:space-y-0">
        {/* Tier 1 Card */}
        <Card
          className={`flex-1 p-4 cursor-pointer border ${
            formData.service === "Signature"
              ? "border-blue-500"
              : "border-gray-300"
          }`}
          onClick={() => handleCardSelect("Signature")}
        >
          <CardHeader>
            <CardTitle>Signature Platform Access (Tier 1)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-custom-dark-blue-1 mt-2">
              DIY Streaming using Amplify’s Virtual Backroom
            </p>
            <ul className="list-disc pl-6 mt-2 text-sm">
              <li>Amplify’s Virtual Backroom Platform Access</li>
              <li>Live Streaming</li>
              <li>Participant Chat</li>
              <li>Whiteboards</li>
              <li>Breakout Rooms</li>
              <li>Polling</li>
              <li>Observation Room</li>
              <li>
                Live observation with real-time observer and moderator chat
              </li>
              <li>Session Deliverables:</li>
              <ul className="list-circle pl-6">
                <li>Audio Recording</li>
                <li>Video Recording</li>
                <li>AI Transcripts</li>
                <li>Chat Transcripts</li>
                <li>Whiteboard & Poll Results</li>
              </ul>
            </ul>
          </CardContent>
        </Card>

        {/* Tier 2 Card */}
        <Card
          className={`flex-1 p-4 cursor-pointer border ${
            formData.service === "Concierge"
              ? "border-blue-500"
              : "border-gray-300"
          }`}
          onClick={() => handleCardSelect("Concierge")}
        >
          <CardHeader>
            <CardTitle>Concierge Platform Access (Tier 2)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-custom-dark-blue-1 mt-2">
              Stream your sessions with the support of Amplify’s first-class team
            </p>
            <ul className="list-disc pl-6 mt-2 text-sm">
              <li>Everything in the Signature Platform Access, plus:</li>
              <ul className="list-disc pl-6">
                <li>Amplify’s Hosting and Project Support</li>
                <li>Hosted Session Check-In:</li>
                <ul className="list-disc pl-6">
                  <li>Test video and sound with each participant</li>
                  <li>
                    Recommend lighting and camera adjustments as needed
                  </li>
                  <li>Verify IDs upon request</li>
                  <li>
                    Verify pre-session requirements (HW, items, etc.)
                  </li>
                  <li>
                    Follow-up with missing participants by phone, email, or
                    text
                  </li>
                </ul>
                <li>Continuous Meeting Monitoring:</li>
                <ul className="list-disc pl-6">
                  <li>
                    Tech Host monitors all sessions to help troubleshoot any
                    participant challenges and provide moderator and observer
                    support
                  </li>
                </ul>
                <li>Amplify Project Support:</li>
                <ul className="list-disc pl-6">
                  <li>
                    Amplify’s project team is available to help with all project
                    setup and to provide backend platform assistance and support
                  </li>
                </ul>
              </ul>
              <li>Access to Optional Add-On Services:</li>
              <ul className="list-disc pl-6">
                {optionalAddOnServices.map((service) => (
                  <li key={service}>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        value={service}
                        checked={formData.addOns?.includes(service) || false}
                        onChange={() => handleCheckboxChange(service)}
                        className="mr-2 cursor-pointer"
                        disabled={formData.service !== "Concierge"}
                      />
                      {service}
                    </label>
                  </li>
                ))}
              </ul>
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Date Picker for First Date of Streaming */}
      <div className="mt-4">
        <label className="block text-sm font-medium text-gray-700">
          First Date of Streaming
        </label>
        <Input
          type="date"
          value={formData.firstDateOfStreaming || ""}
          onChange={handleDateChange}
          className="mt-1 w-full"
        />
      </div>
    </div>
  );
};

export default Step1;

```

### components/projects/createProject/Step2Component.tsx
```javascript
"use client";

import React from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { Button } from "components/ui/button";
import { Input } from "components/ui/input";
import { Textarea } from "components/ui/textarea"; 
import { useRouter } from "next/navigation";
import axios from "axios";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { IProjectFormState, Step2FormValues, Step2Props } from "@shared/interface/CreateProjectInterface";

const Step2: React.FC<Step2Props> = ({ formData, updateFormData, uniqueId }) => {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Step2FormValues>({
    defaultValues: {
      respondentsPerSession: formData.respondentsPerSession,
      numberOfSessions: formData.numberOfSessions,
      sessionLength: formData.sessionLength,
      preWorkDetails: formData.preWorkDetails,
      selectedLanguage: formData.selectedLanguage,
      languageSessionBreakdown: formData.languageSessionBreakdown,
      additionalInfo: formData.additionalInfo,
      inLanguageHosting: formData.inLanguageHosting as "yes" | "no" || undefined,
      recruitmentSpecs: formData.recruitmentSpecs || "",
    },
  });

  const mutation = useMutation({
    mutationFn: (data: { userId: string; uniqueId: string | null; formData: IProjectFormState }) =>
      axios.post(`${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/api/v1/projects/email-project-info`, data),

    onSuccess: () => {
      toast.success("Project information sent successfully");
      router.push("/projects");
    },

    onError: (error: unknown) => {
      console.error("Error sending project info", error);
      
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.message || "Something went wrong");
      } else {
        toast.error("An unexpected error occurred.");
      }
    },
  });


  const onSubmit: SubmitHandler<Step2FormValues> = (data) => {
    const mergedData = { ...formData, ...data };
    updateFormData(data); 

    mutation.mutate({
      userId: formData.user,
      uniqueId, 
      formData: mergedData,
    });
  };
  
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="bg-gray-100 p-4 rounded-md">
        <h2 className="text-xl font-bold mb-2 text-center">
          Project Information Request
        </h2>
        <p className="text-sm text-center">
          An Amplify Team member will be in touch by the end of the next business day with a quote,
          or to gather more information so that we can provide you with the best pricing and service.
          If you need costs sooner or have more information to provide, please feel free to email
          info@amplifyresearch.com. Thank you!
        </p>
      </div>

      {/* Basic Project Info Fields */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="col-span-1">
          <label className="block text-sm font-medium text-gray-700">
            Number of Respondents per Session
          </label>
          <Input
            type="number"
            {...register("respondentsPerSession", { required: true, valueAsNumber: true })}
            className="mt-1 w-full"
          />
          {errors.respondentsPerSession && <p className="text-red-500 text-xs">This field is required</p>}
        </div>
        <div className="col-span-1">
          <label className="block text-sm font-medium text-gray-700">
            Number of Sessions
          </label>
          <Input
            type="number"
            {...register("numberOfSessions", { required: true, valueAsNumber: true })}
            className="mt-1 w-full"
          />
          {errors.numberOfSessions && <p className="text-red-500 text-xs">This field is required</p>}
        </div>
        <div className="col-span-1">
          <label className="block text-sm font-medium text-gray-700">
            Length(s) of Sessions (minutes)
          </label>
          <Input
            type="number"
            {...register("sessionLength", { required: true })}
            className="mt-1 w-full"
          />
          {errors.sessionLength && <p className="text-red-500 text-xs">This field is required</p>}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Will there be any pre–work or additional assignments?
        </label>
        <Input
          type="text"
          {...register("preWorkDetails", { required: true })}
          className="mt-1 w-full"
        />
        {errors.preWorkDetails && <p className="text-red-500 text-xs">This field is required</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            What language?
          </label>
          <Input
            type="text"
            {...register("selectedLanguage", { required: true })}
            className="mt-1 w-full"
          />
          {errors.selectedLanguage && <p className="text-red-500 text-xs">This field is required</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            If some sessions will be in English and some will be non–English, please specify how many of each:
          </label>
          <Textarea
            {...register("languageSessionBreakdown", { required: true })}
            className="mt-1 w-full"
          />
          {errors.languageSessionBreakdown && <p className="text-red-500 text-xs">This field is required</p>}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Anything else we should know about the project?
        </label>
        <Textarea
          {...register("additionalInfo")}
          className="mt-1 w-full"
        />
      </div>

      {/* Conditional Field: If Multi–Language Services was selected */}
      {formData.addOns.includes("Multi-Language Services") && (
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Will you need hosting in a language other than English?
          </label>
          <div className="flex items-center space-x-4 mt-1">
            <label className="flex items-center space-x-1">
              <input
                type="radio"
                value="yes"
                {...register("inLanguageHosting", { required: true })}
                className="cursor-pointer"
              />
              <span className="text-sm">Yes</span>
            </label>
            <label className="flex items-center space-x-1">
              <input
                type="radio"
                value="no"
                {...register("inLanguageHosting", { required: true })}
                className="cursor-pointer"
              />
              <span className="text-sm">No</span>
            </label>
          </div>
          {errors.inLanguageHosting && <p className="text-red-500 text-xs">Please select an option</p>}
        </div>
      )}

      {/* Conditional Field: If Top–Notch Recruiting was selected */}
      {formData.addOns.includes("Top-Notch Recruiting") && (
        <div>
          <label className="block text-sm font-medium text-gray-700">
            What are the target recruitment specs? Please include as much information as possible:
          </label>
          <Textarea
            {...register("recruitmentSpecs", { required: true })}
            className="mt-1 w-full"
          />
          {errors.recruitmentSpecs && <p className="text-red-500 text-xs">This field is required</p>}
        </div>
      )}

      <div className="text-center">
        <Button type="submit" className="mt-4">
          Submit Project Information
        </Button>
      </div>
    </form>
  );
};

export default Step2;

```

### components/projects/createProject/Step3Component.tsx
```javascript
"use client";

import React, { useState, useEffect } from "react";
import { Label } from "components/ui/label";
import { Input } from "components/ui/input";
import { Button } from "components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
} from "components/ui/select";
import { CheckIcon } from "lucide-react";
import {
  IProjectSession,
  SessionRow,
} from "@shared/interface/ProjectInterface";
import { availableLanguages, durationMapping, durations } from "constant";
import { Popover, PopoverContent, PopoverTrigger } from "components/ui/popover";
import {
  Command,
  CommandInput,
  CommandItem,
  CommandList,
} from "components/ui/command";
import { Step3Props } from "@shared/interface/CreateProjectInterface";

const Step3: React.FC<Step3Props> = ({ formData, updateFormData }) => {
  // ========= Respondent Languages =========
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(
    Array.isArray(formData.respondentLanguage)
      ? formData.respondentLanguage
      : formData.respondentLanguage
      ? [formData.respondentLanguage]
      : []
  );
  const [otherLanguage, setOtherLanguage] = useState<string>("");
  const [projectName, setProjectName] = useState<string>(formData.name || "");

  // ========= Respondent Country =========
  const isInitiallyOther =
    formData.respondentCountry && formData.respondentCountry !== "USA";
  const [countrySelection, setCountrySelection] = useState<"USA" | "Other">(
    isInitiallyOther ? "Other" : "USA"
  );
  const [otherCountry, setOtherCountry] = useState<string>(
    isInitiallyOther ? formData.respondentCountry : ""
  );

  // ========= Sessions =========
  const [sessionRows, setSessionRows] = useState<SessionRow[]>(
    formData.sessions && Array.isArray(formData.sessions)
      ? formData.sessions.map((s: IProjectSession, index: number) => ({
          id: String(index),
          number: s.number,
          duration: s.duration,
        }))
      : []
  );

  // ========= Update Parent State =========
  useEffect(() => {
    // Compute final respondent languages:
    // Replace "Other" with the input from the otherLanguage field, if provided.
    const computedLanguages = selectedLanguages.includes("Other")
      ? [
          ...selectedLanguages.filter((lang) => lang !== "Other"),
          ...(otherLanguage.trim() ? [otherLanguage.trim()] : []),
        ]
      : selectedLanguages;

    const finalCountry =
      countrySelection === "USA" ? "USA" : otherCountry.trim();

    updateFormData({
      name: projectName,
      respondentLanguage: computedLanguages,
      respondentCountry: finalCountry,
      sessions: sessionRows.map((row) => ({
        number: row.number,
        duration: row.duration,
      })),
    });

    // Excluding updateFormData from dependencies to avoid potential infinite loops.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    projectName,
    selectedLanguages,
    otherLanguage,
    countrySelection,
    otherCountry,
    sessionRows,
  ]);

  // ========= Multi-Select Handlers =========
  const toggleLanguage = (lang: string) => {
    if (selectedLanguages.includes(lang)) {
      setSelectedLanguages(selectedLanguages.filter((l) => l !== lang));
    } else {
      setSelectedLanguages([...selectedLanguages, lang]);
    }
  };

  // ========= Respondent Country Handlers =========
  const handleCountrySelection = (value: "USA" | "Other") => {
    setCountrySelection(value);
    if (value === "USA") {
      setOtherCountry("");
    }
  };

  const handleOtherCountryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setOtherCountry(e.target.value);
  };

  // ========= Sessions Handlers =========
  const addSessionRow = () => {
    const newRow: SessionRow = {
      id: Date.now().toString(),
      number: 1,
      duration: durations[0],
    };
    setSessionRows((prev) => [...prev, newRow]);
  };

  const updateSessionRow = <K extends keyof SessionRow>(
    id: string,
    field: K,
    value: SessionRow[K]
  ) => {
    setSessionRows((prev) =>
      prev.map((row) => (row.id === id ? { ...row, [field]: value } : row))
    );
  };

  const deleteSessionRow = (id: string) => {
    setSessionRows((prev) => prev.filter((row) => row.id !== id));
  };

  const totalSessions = sessionRows.reduce(
    (acc, row) => acc + Number(row.number),
    0
  );

  const totalDurationMinutes = sessionRows.reduce(
    (acc, row) =>
      acc + Number(row.number) * (durationMapping[row.duration] || 0),
    0
  );

  const totalHoursDecimal = totalDurationMinutes / 60;
  const hoursText =
    totalHoursDecimal % 1 === 0
      ? String(totalHoursDecimal)
      : totalHoursDecimal.toFixed(2);

  return (
    <div className="space-y-6">
      {/* Project Name Input */}
      <div>
        <Label className="block text-sm font-medium text-gray-700">
          Project Name*
        </Label>
        <Input
          type="text"
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
          className="mt-1 w-full"
        />
      </div>
      {/* Multi-Select for Languages using Popover and Command */}
      <div>
        <Label className="block text-sm font-medium text-gray-700">
          Respondent Language(s)*
        </Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-full text-left">
              {selectedLanguages.length > 0
                ? selectedLanguages.join(", ")
                : "Select languages"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0">
            <Command>
              <CommandInput placeholder="Search languages..." />
              <CommandList>
                {availableLanguages.map((lang) => (
                  <CommandItem
                    key={lang}
                    onSelect={() => toggleLanguage(lang)}
                    className="cursor-pointer"
                  >
                    {selectedLanguages.includes(lang) && (
                      <CheckIcon className="mr-2 h-4 w-4" />
                    )}
                    {lang}
                  </CommandItem>
                ))}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
        {selectedLanguages.includes("Other") && (
          <div className="mt-2">
            <Label className="block text-sm font-medium text-gray-700">
              Other Language(s)*
            </Label>
            <Input
              type="text"
              value={otherLanguage}
              onChange={(e) => setOtherLanguage(e.target.value)}
            />
          </div>
        )}
        {formData.service === "Concierge" && (
          <p className="text-sm text-gray-500 mt-2">
            If selected Concierge Service, please note that all Amplify hosting
            will be in English. If you need in-language hosting, please select
            in-Language Services on the previous screen.
          </p>
        )}
      </div>

      {/* Respondent Country using Shadcn UI Select */}
      <div>
        <Label className="block text-sm font-medium text-gray-700">
          Respondent Country
        </Label>
        <Select
          value={countrySelection}
          onValueChange={(value: "USA" | "Other") =>
            handleCountrySelection(value)
          }
        >
          <SelectTrigger className="w-full">
            <Button variant="outline" className="w-full text-left">
              {countrySelection}
            </Button>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="USA">USA</SelectItem>
            <SelectItem value="Other">Other</SelectItem>
          </SelectContent>
        </Select>
        {countrySelection === "Other" && (
          <div className="mt-2">
            <Label className="block text-sm font-medium text-gray-700">
              Specify Country Name
            </Label>
            <Input
              type="text"
              value={otherCountry}
              onChange={handleOtherCountryChange}
            />
          </div>
        )}
      </div>

      {/* Sessions Table */}
      <div>
        <h2 className="text-lg font-bold">Sessions</h2>
        <table className="min-w-full mt-4 border">
          <thead>
            <tr>
              <th className="border px-4 py-2">Number of Sessions</th>
              <th className="border px-4 py-2">Duration</th>
              <th className="border px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sessionRows.map((row) => (
              <tr key={row.id}>
                <td className="border px-4 py-2">
                  <Input
                    type="number"
                    min="1"
                    value={row.number}
                    onChange={(e) =>
                      updateSessionRow(row.id, "number", Number(e.target.value))
                    }
                    className="w-full"
                  />
                </td>
                <td className="border px-4 py-2">
                  <Select
                    value={row.duration}
                    onValueChange={(value) =>
                      updateSessionRow(row.id, "duration", value)
                    }
                  >
                    <SelectTrigger className="w-full">
                      <Button variant="outline" className="w-full text-left">
                        {row.duration}
                      </Button>
                    </SelectTrigger>
                    <SelectContent>
                      {durations.map((d) => (
                        <SelectItem key={d} value={d}>
                          {d}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </td>
                <td className="border px-4 py-2 text-center">
                  <Button
                    variant="outline"
                    onClick={() => deleteSessionRow(row.id)}
                  >
                    Delete
                  </Button>
                </td>
              </tr>
            ))}
            <tr>
              <td className="border px-4 py-2 font-bold">
                Total Sessions: {totalSessions}
              </td>
              <td className="border px-4 py-2 font-bold" colSpan={2}>
                Total Duration: {hoursText} hour{hoursText !== "1" ? "s" : ""} (
                {totalDurationMinutes} minute
                {totalDurationMinutes !== 1 ? "s" : ""})
              </td>
            </tr>
          </tbody>
        </table>
        <div className="mt-4">
          <Button onClick={addSessionRow}>+ Add Session</Button>
        </div>
      </div>
    </div>
  );
};

export default Step3;

```

### components/projects/createProject/Step4Component.tsx
```javascript
"use client";
import React, { useState } from "react";
import { Button } from "components/ui/button";
import { Select, SelectTrigger, SelectContent, SelectItem } from "components/ui/select";
import PaymentIntegration from "./PaymentIntegrationComponent";
import { creditPackages, durationMapping, quantityOptions } from "constant";
import { IProjectFormState, Step4Props } from "@shared/interface/CreateProjectInterface";


const Step4: React.FC<Step4Props> = ({ formData, uniqueId }) => {
  // State to determine whether to show the payment integration UI
  const [showPaymentIntegration, setShowPaymentIntegration] = useState(false);

  // State to hold the quantities of each credit package selected by the user
  const [purchaseQuantities, setPurchaseQuantities] = useState<{ [key: number]: number }>({
    500: 0,
    2500: 0,
    15000: 0,
    50000: 0,
  });

  // Compute the project estimate rows based on sessions data
  const sessions = formData.sessions || [];
 
  // First, build the estimate rows
const projectEstimateRows = sessions.map((session) => {
  const quantity = Number(session.number) || 0;
  const sessionDuration = durationMapping[session.duration] || Number(session.duration) || 0;
  const estimatedHours = (quantity * sessionDuration) / 60;
  const creditsNeeded = (quantity * sessionDuration) * 2.75;

  return {
    service: formData.service,
    quantity,
    sessionDuration,
    estimatedHours: estimatedHours.toFixed(2),
    creditsNeeded: creditsNeeded.toFixed(2),
  };
});

// Then calculate total from them
const totalCreditsNeeded = projectEstimateRows.reduce(
  (acc, row) => acc + parseFloat(row.creditsNeeded),
  0
);

  // Handle changes to the quantity of a credit package
  const handleQuantityChange = (pkg: number, qty: number) => {
    setPurchaseQuantities((prev) => ({
      ...prev,
      [pkg]: qty,
    }));
  };

  // Calculate the total purchase price from selected credit packages
  const totalPurchasePrice = creditPackages.reduce((acc, pkg) => {
    const quantity = purchaseQuantities[pkg.package] || 0;
    return acc + quantity * pkg.cost;
  }, 0);

   // *** NEW *** Calculate the total credits based on the Purchase Credits table selection.
   const totalPurchasedCredits = creditPackages.reduce((acc, pkg) => {
    const quantity = purchaseQuantities[pkg.package] || 0;
    return acc + quantity * pkg.package;
  }, 0);

  // When Pay Now is clicked, switch to the Payment Integration UI
  const handlePayNow = () => {
    setShowPaymentIntegration(true);
  };

  // Render the PaymentIntegration component if the user has clicked "Pay Now"
  if (showPaymentIntegration) {
    return <PaymentIntegration totalPurchasePrice={totalPurchasePrice} 
    totalCreditsNeeded={totalPurchasedCredits}
    projectData={formData as IProjectFormState}
    uniqueId={uniqueId}
    />;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-center">Project Review</h1>

      {/* Project Details */}
      <div className="border p-4 rounded-md">
        <h2 className="text-xl font-semibold mb-2">Project Details</h2>
        <p>
          <span className="font-medium">Project Name: </span>
          {formData.name}
        </p>
        <p>
          <span className="font-medium">Service: </span>
          {formData.service}
        </p>
        <p>
          <span className="font-medium">Respondent Country: </span>
          {formData.respondentCountry}
        </p>
        <p>
          <span className="font-medium">Respondent Language: </span>
          {Array.isArray(formData.respondentLanguage)
            ? formData.respondentLanguage.join(", ")
            : formData.respondentLanguage}
        </p>
      </div>

      {/* Project Estimate Table */}
      <div className="overflow-x-auto">
        <h2 className="text-xl font-semibold mb-2">Project Estimate</h2>
        <table className="min-w-full border-collapse border border-gray-300">
          <thead>
            <tr>
              <th className="border px-4 py-2">Service</th>
              <th className="border px-4 py-2">Quantity</th>
              <th className="border px-4 py-2">Session Duration (mins)</th>
              <th className="border px-4 py-2">Estimated Hours</th>
              <th className="border px-4 py-2">Total Credit Needed</th>
            </tr>
          </thead>
          <tbody>
            {projectEstimateRows.map((row, idx) => (
              <tr key={idx}>
                <td className="border px-4 py-2 text-center">{row.service}</td>
                <td className="border px-4 py-2 text-center">{row.quantity}</td>
                <td className="border px-4 py-2 text-center">{row.sessionDuration}</td>
                <td className="border px-4 py-2 text-center">{row.estimatedHours}</td>
                <td className="border px-4 py-2 text-center">{row.creditsNeeded}</td>
              </tr>
            ))}
            <tr>
              <td className="border px-4 py-2 font-bold text-right" colSpan={4}>
                Total Credits Needed
              </td>
              <td className="border px-4 py-2 text-center font-bold">
                {totalCreditsNeeded.toFixed(2)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Available Credits */}
      <div className="border p-4 rounded-md">
        <h2 className="text-xl font-semibold mb-2">Available Credits</h2>
        <p className="text-2xl">0</p>
      </div>

      {/* Purchase Credits Table */}
      <div className="overflow-x-auto">
        <h2 className="text-xl font-semibold mb-2">Purchase Credits</h2>
        <table className="min-w-full border-collapse border border-gray-300">
          <thead>
            <tr>
              <th className="border px-4 py-2">Quantity</th>
              <th className="border px-4 py-2">Credit Package</th>
              <th className="border px-4 py-2">Cost</th>
              <th className="border px-4 py-2">Total Price (USD)</th>
            </tr>
          </thead>
          <tbody>
            {creditPackages.map((pkg) => {
              const quantity = purchaseQuantities[pkg.package] || 0;
              const totalPrice = quantity * pkg.cost;
              return (
                <tr key={pkg.package}>
                  <td className="border px-4 py-2 text-center">
                    <Select
                      value={quantity ? quantity.toString() : ""}
                      onValueChange={(val) =>
                        handleQuantityChange(pkg.package, Number(val))
                      }
                    >
                      <SelectTrigger className="w-20">
                        <span>{quantity || "Select"}</span>
                      </SelectTrigger>
                      <SelectContent>
                        {quantityOptions.map((q) => (
                          <SelectItem key={q} value={q.toString()}>
                            {q}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="border px-4 py-2 text-center">{pkg.package}</td>
                  <td className="border px-4 py-2 text-center">{pkg.cost}</td>
                  <td className="border px-4 py-2 text-center">{totalPrice}</td>
                </tr>
              );
            })}
            <tr>
              <td className="border px-4 py-2 font-bold text-right" colSpan={3}>
                Total Price (USD)
              </td>
              <td className="border px-4 py-2 text-center font-bold">
                {totalPurchasePrice}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Terms and Conditions */}
      <div className="border p-4 rounded-md">
        <h2 className="text-xl font-semibold mb-2">Terms and Conditions</h2>
        <p className="text-sm">
          Credits purchased are tied to your account and can be used for any project you create. You
          can add credits at any time. <br />
          Signature Service will be billed based on actual streaming time and will be charged in
          15-minute increments. <br />
          Concierge Service is billed based on scheduled sessions. You may reschedule or modify a
          session up to three business days in advance without penalty. Cancellations, changes, or no-shows
          within three business days of any session will be charged the full time of the original scheduled
          session, along with any additional time required for rescheduling. Sessions will be charged in
          15-minute increments. <br />
          If you exceed your pre-paid credits—including time overages and/or scheduling changes—you will be
          billed at a rate of $175 per 100 credits, billed in 100 credit increments to replenish your account.
          These credits will be automatically charged to your credit card on file on the day the usage is
          incurred.
        </p>
      </div>

      {/* Pay Now Button */}
      <div className="text-center">
        <Button onClick={handlePayNow}>Pay Now</Button>
      </div>
    </div>
  );
};

export default Step4;

```

### components/projects/AccountActivationUI.tsx
```javascript
import React from "react";
import { Card, CardContent, CardHeader } from "components/ui/card";
import BackToLogin from "./BackToLogin";
import { FaEnvelopeOpenText } from "react-icons/fa";

interface AccountActivationUIProps {
  email: string;
}

const AccountActivationUI: React.FC<AccountActivationUIProps> = ({ email }) => {
  return (
    <div className="py-20 min-h-screen flex flex-col justify-center items-center">
      <Card className="max-w-2xl mx-auto rounded-xl">
        <CardHeader className="flex justify-center items-center py-5">
          <FaEnvelopeOpenText className="h-16 w-16 text-black" />
        </CardHeader>
        <CardContent className="px-10 lg:px-20">
          <div className="text-center space-y-4">
            <h1 className="font-bold text-2xl md:text-3xl">
              Account Activation
            </h1>
            <p className="text-slate-600">
              Thank you for signing up. A verification link has been sent to
            </p>
            <p className="text-gray-500 text-lg">{email}</p>
            <p className="text-slate-600">
              Please click the link in the email to verify your account.
            </p>
          </div>

          {/* Uncomment to include Resend Email button
          <div className="pt-10">
            <Button 
              variant="default" 
              className="w-full font-bold text-lg py-2 rounded-xl"
            >
              Resend Email
            </Button>
          </div>
          */}

          <div className="pt-14 pb-16 text-center">
            <BackToLogin />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AccountActivationUI;

```

### components/projects/BackToLogin.tsx
```javascript
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

```

### components/projects/ConfirmationModalComponent.tsx
```javascript
import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog'
import { Button } from './ui/button'

interface ConfirmationModalProps {
  open: boolean
  onCancel: () => void
  onYes: () => void
  heading: string
  text: string
}

const ConfirmationModalComponent: React.FC<ConfirmationModalProps> = ({
  open,
  onCancel,
  onYes,
  heading,
  text,
}) => {
  return (
    <Dialog open={open} onOpenChange={onCancel}>
      <DialogContent className='rounded-2xl w-[420px]'>
        <DialogHeader>
          <DialogTitle className='text-[#031F3A] text-2xl'>
            {heading}
          </DialogTitle>
          <DialogDescription className='text-[#AFAFAF] text-[11px]'>
            {text}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className='gap-4 sm:justify-end mt-12'>
          <Button
            variant='dark-blue'
            type='button'
            onClick={onCancel}
            className='rounded-xl py-1 px-7 shadow-[0px_3px_6px_#031F3A59] text-base'
          >
            Cancel
          </Button>
          <Button
            variant='orange'
            type='button'
            onClick={onYes}
            className='rounded-xl py-1 px-10 shadow-[0px_3px_6px_#031F3A59] text-base'
          >
            Yes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default ConfirmationModalComponent

```

### components/projects/DashboardSidebarComponent.tsx
```javascript
'use client'

import React, { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import Logo from './LogoComponent'
import { FaBars, FaListAlt, FaUserClock } from 'react-icons/fa'
import { MdOutlineInsertChart } from 'react-icons/md'
import { AiOutlineClose } from 'react-icons/ai'
import { BsThreeDotsVertical } from 'react-icons/bs'
import { ChevronDown, ChevronUp, CircleUser, FileText, UserPen } from 'lucide-react'
import { IoIosLogOut } from 'react-icons/io'
import { IProject } from '@shared/interface/ProjectInterface'
import api from 'lib/api'
import { useGlobalContext } from 'context/GlobalContext'

export default function DashboardSidebarComponent({
  handleLogoutModalOpen,
}: {
  handleLogoutModalOpen: () => void
}) {
  const pathname = usePathname()!
  const router = useRouter()
  const modalRef = useRef<HTMLDivElement>(null)
  const [mobileOpen, setMobileOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const { user } = useGlobalContext()
  const [acctOpen, setAcctOpen] = useState(false)
  const [showLogoutMenu, setShowLogoutMenu] = useState(false)

  // fetch only this user's projects
  const userId = user?._id
  const { data: projects = [] } = useQuery<IProject[], Error>({
    queryKey: ['projectsByUser', userId],
    queryFn: () =>
      api
        .get(`/api/v1/projects/get-project-by-userId/${userId}`)
        .then((r) => r.data.data),
    staleTime: 300_000,
    enabled: Boolean(userId),
  })

  // detect active project in URL
  const segments = pathname.split('/').filter(Boolean)
  const pIdx = segments.indexOf('projects')
  const projectId = (pIdx > -1 && segments.length > pIdx + 1) ? segments[pIdx + 1] : null

  // toggle projects list
  const [showProjects, setShowProjects] = useState(
    pathname.startsWith('/projects')
  )

  // sub-nav for the active project
  const projectSubNav = projectId
    ? [
        { label: 'Sessions', href: `/projects/${projectId}/sessions` },
        { label: 'Session Deliverables', href: `/projects/${projectId}/session-deliverables` },
        { label: 'Observer Documents', href: `/projects/${projectId}/observer-documents` },
        { label: 'Project Team', href: `/projects/${projectId}/project-team` },
        { label: 'Polls', href: `/projects/${projectId}/polls` },
        { label: 'Reports', href: `/projects/${projectId}/reports` },
      ]
    : []

  // close account dropdown and logout dropdown on outside click
  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowLogoutMenu(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  return (
    <>
      {/* Mobile hamburger */}
      <div className="md:hidden fixed top-4 left-4 z-30">
        <FaBars
          className="text-2xl cursor-pointer"
          onClick={() => setMobileOpen(v => !v)}
        />
      </div>

      <aside className={`
        flex flex-col fixed md:relative top-0 left-0 h-screen w-64 z-40
        bg-white shadow transform transition-transform
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Mobile close */}
        <div className="md:hidden absolute top-4 right-4">
          <AiOutlineClose
            className="text-2xl cursor-pointer"
            onClick={() => setMobileOpen(false)}
          />
        </div>

        {/* Logo */}
        <div className="py-8 px-6"><Logo /></div>

        {/* Main nav */}
        <nav className="px-6 flex-1 overflow-auto">
          {/* Projects header */}
          <div
            className={`
              flex items-center justify-between w-full gap-3 py-2 font-semibold cursor-pointer
              ${pathname.startsWith('/projects')
                ? 'text-blue-600'
                : 'text-gray-700 hover:text-gray-900'
              }
            `}
            onClick={() => {
              router.push('/projects')
              setShowProjects(v => !v)
            }}
          >
            <div className="flex items-center gap-3">
              <FaListAlt /><span>Projects</span>
            </div>
            {showProjects ? <ChevronUp /> : <ChevronDown />}
          </div>

          {/* List projects with nested sub-menu under active one */}
          {showProjects && (
            <ul className="ml-6 mt-2 space-y-1">
              {projects.map(p => {
                const href = `/projects/${p._id}`
                const active = pathname.startsWith(href)
                return (
                  <React.Fragment key={p._id}>
                    <li>
                      <Link
                        href={href}
                        className={`block py-1 ${
                          active
                            ? 'text-blue-500 font-medium'
                            : 'text-gray-600 hover:text-gray-800'
                        }`}
                      >
                        {p.name}
                      </Link>
                    </li>

                    {active && projectSubNav.length > 0 && (
                      <ul className="ml-6 mt-1 space-y-1">
                        {projectSubNav.map(it => (
                          <li key={it.href}>
                            <Link
                              href={it.href}
                              className={`block py-1 ${
                                pathname === it.href
                                  ? 'text-blue-400 underline'
                                  : 'text-gray-600 hover:text-gray-800'
                              }`}
                            >
                              {it.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </React.Fragment>
                )
              })}
            </ul>
          )}

          {/* Other static links */}
          <div className="mt-8 space-y-4">
            <Link href="/observers">
              <div className="flex items-center gap-3">
                <FaUserClock /><span>Observers</span>
              </div>
            </Link>

            {/* Account submenu */}
            <div
              className="flex flex-col gap-1 cursor-pointer"
              onClick={() => setAcctOpen(v => !v)}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <CircleUser /><span>Account</span>
                </div>
                {acctOpen ? <ChevronUp /> : <ChevronDown />}
              </div>
              {acctOpen && (
                <div ref={modalRef} className="pl-8 mt-2 space-y-2">
                  <Link href={`/my-profile/${user?._id}`} className="flex items-center gap-2">
                    <UserPen /> Profile
                  </Link>
                  <Link href="/payment" className="flex items-center gap-2">
                    <FileText /> Billing
                  </Link>
                </div>
              )}
            </div>

            {user?.role === 'AmplifyAdmin' && (
              <>
                <Link href="/external-admins">
                  <div className="flex items-center gap-3">
                    <FaUserClock /><span>External Admins</span>
                  </div>
                </Link>
                <Link href="/internal-admins">
                  <div className="flex items-center gap-3">
                    <FaUserClock /><span>Internal Admins</span>
                  </div>
                </Link>
                <Link href="/companies">
                  <div className="flex items-center gap-3">
                    <MdOutlineInsertChart /><span>Companies</span>
                  </div>
                </Link>
              </>
            )}
          </div>
        </nav>

       {/* User info pinned to bottom */}
<div className="px-6 mt-auto pb-6">
  <div className="relative flex items-center justify-between p-3 bg-gray-100 rounded-lg overflow-visible">
    {/* Left side: avatar + names */}
    <div className="flex items-center gap-3">
      <Image
        src="/user.jpg"
        alt="avatar"
        width={36}
        height={36}
        className="rounded-full"
      />
      <div className="text-sm">
        <p className="font-semibold truncate">
          {user?.firstName} {user?.lastName}
        </p>
        <p className="text-xs text-gray-600 truncate w-40">{user?.email}</p>
      </div>
    </div>

    {/* Right side: three-dots */}
    <button
      className="p-1 cursor-pointer"
      onClick={() => setShowLogoutMenu((v) => !v)}
    >
      <BsThreeDotsVertical size={20} />
    </button>

    {/* Logout pop-over */}
    {showLogoutMenu && (
      <div
        ref={menuRef}
        className="absolute bottom-full right-0 mt-2 w-36 bg-white border rounded shadow-lg z-50"
      >
        <button
          className="flex items-center w-full px-4 py-2 hover:bg-gray-100 cursor-pointer"
          onClick={() => {
            setShowLogoutMenu(false)
            handleLogoutModalOpen()
          }}
        >
          <IoIosLogOut className="mr-2" /> Logout
        </button>
      </div>
    )}
  </div>
</div>

    </aside>
    </>
  )
}

```

### components/projects/FooterComponent.tsx
```javascript
import { FaEnvelope } from 'react-icons/fa'
import { IoCall } from 'react-icons/io5'
import { PiLineVerticalLight } from 'react-icons/pi'

const FooterComponent = () => {
  return (
    <div>
      {/* for large screen */}
      <div className='h-20 bg-[#00293C] w-full lg:flex justify-center items-center space-x-4 hidden z-10'>
        <div className='flex justify-center items-center gap-2'>
          <FaEnvelope className='text-white' />
          <p className='text-white text-sm'>info@amplifyresearch.com</p>
        </div>
        <PiLineVerticalLight className='text-white' />
        <div className='flex justify-center items-center gap-2'>
          <IoCall className='text-white' />
          <p className='text-white text-sm'>925 236 9700</p>
        </div>
        <PiLineVerticalLight className='text-white' />
        <p className='text-white text-sm'>Terms & Conditions</p>
        <PiLineVerticalLight className='text-white' />
        <p className='text-white text-sm'>Privacy Policy</p>
      </div>
      {/* for small screen */}
      <div className=' bg-[#00293C] w-full  lg:hidden py-5'>
        <div className='flex justify-center items-center gap-2'>
          <FaEnvelope className='text-white text-xs' />
          <p className='text-white text-xs'>info@amplifyresearch.com</p>
        </div>
        <div className='flex justify-center items-center space-x-2 pt-3'>
          <div className='flex justify-center items-center gap-2 '>
            <IoCall className='text-white text-xs' />
            <p className='text-white text-xs'>925 236 9700</p>
          </div>
          <PiLineVerticalLight className='text-white' />
          <p className='text-white text-xs'>Terms & Conditions</p>
          <PiLineVerticalLight className='text-white' />
          <p className='text-white text-xs'>Privacy Policy</p>
        </div>
      </div>
    </div>
  )
}

export default FooterComponent

```

### components/projects/InputFieldComponent.tsx
```javascript
'use client'

import * as React from 'react'
import { BiSolidErrorAlt } from 'react-icons/bi'
import { Input } from './ui/input'
import { Label } from './ui/label'

interface InputFieldProps {
  label: string
  type?: string
  name: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  placeholder?: string
  error?: string
  icon?: React.ReactNode
  emailSuccess?: boolean
  disabled?: boolean
}

const InputFieldComponent: React.FC<InputFieldProps> = ({
  label,
  type = 'text',
  name,
  value,
  onChange,
  placeholder,
  error,
  icon,
  emailSuccess,
  disabled = false,
}) => {
  return (
    <div className='mb-4'>
      <Label
        htmlFor={name}
        className='block text-sm font-semibold text-black mb-2'
      >
        {label}
      </Label>
      <div className='relative'>
        <Input
          type={type}
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          className={`pr-10 ${error ? 'border-custom-red' : 'border-black'}`}
        />
        {icon && (
          <span className='absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5'>
            {icon}
          </span>
        )}
      </div>
      {error && (
        <div className='flex items-start gap-1 mt-2 text-sm text-custom-red'>
          <BiSolidErrorAlt className='mt-0.5' />
          <p className='text-xs'>{error}</p>
        </div>
      )}
      {emailSuccess && (
        <div className='flex items-start gap-1 mt-2 text-sm text-custom-green'>
          <BiSolidErrorAlt className='mt-0.5' />
          <p className='text-xs'>Your Email is available.</p>
        </div>
      )}
    </div>
  )
}

export default InputFieldComponent

```

### components/projects/LogoutModalComponent.tsx
```javascript
'use client'
import { useGlobalContext } from 'context/GlobalContext'
import { useRouter } from 'next/navigation'
import React from 'react'
import { Button } from './ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog'
import api from 'lib/api'

interface LogoutModalProps {
  open: boolean
  onClose: () => void
}

const LogoutModalComponent: React.FC<LogoutModalProps> = ({
  open,
  onClose,
}) => {
  const { setUser } = useGlobalContext()
  const router = useRouter()

  const handleLogout = async () => {
    try {
      await api.post("/api/v1/users/logout")
      localStorage.clear()
      setUser(null)
      router.push('/login')
    } catch (error) {
      console.error('Logout error:', error)
      // Still clear local state even if server request fails
      localStorage.clear()
      setUser(null)
      router.push('/login')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className='rounded-2xl w-[420px]'>
        <DialogHeader>
          <DialogTitle className='text-[#031F3A] text-2xl'>Log Out</DialogTitle>
          <DialogDescription className='text-[#AFAFAF] text-[11px]'>
            Are you sure you want to logout?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className='gap-4 sm:justify-end mt-8'>
          <Button
            variant='dark-blue'
            type='button'
            onClick={onClose}
            className='rounded-xl py-1 px-7 shadow-[0px_3px_6px_#031F3A59] text-base'
          >
            Cancel
          </Button>
          <Button
            variant='teal'
            type='button'
            onClick={handleLogout}
            className='rounded-xl py-1 px-10 shadow-[0px_3px_6px_#031F3A59] text-base'
          >
            Yes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default LogoutModalComponent

```

### components/projects/PasswordModalComponent.tsx
```javascript
'use client'

import React, { useState } from 'react'
import axios from 'axios'
import { toast } from 'sonner'
import { Eye, EyeOff } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog'
import { Button } from './ui/button'
import { Label } from './ui/label'
import { Input } from './ui/input'

interface PasswordModalProps {
  open: boolean
  onClose: () => void
  id: string
}

interface Errors {
  currentPassword?: string
  newPassword?: string
  confirmPassword?: string
}

const PasswordModalComponent: React.FC<PasswordModalProps> = ({
  open,
  onClose,
  id,
}) => {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [errors, setErrors] = useState<Errors>({})
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const validateForm = (): boolean => {
    const formErrors: Errors = {}

    if (!currentPassword) {
      formErrors.currentPassword = 'Current password is required.'
    }

    const strongPasswordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d])[A-Za-z\d\S]{8,}$/

    if (!strongPasswordRegex.test(newPassword)) {
      formErrors.newPassword =
        'Password must contain at least 8 characters, including uppercase, lowercase, numbers, and special characters.'
    }

    if (newPassword !== confirmPassword) {
      formErrors.confirmPassword = 'Passwords do not match.'
    }

    setErrors(formErrors)
    return Object.keys(formErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/api/v1/users/change-password`,
        {
          userId: id,
          oldPassword: currentPassword,
          newPassword,
        }
      )

      if (response.status === 200) {
        toast.success(response.data.message || 'Password updated successfully.')
        onClose()
      }
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || 'An unexpected error occurred.'
      )
    }
  }

  const PasswordInput = ({
    label,
    value,
    onChange,
    show,
    toggleShow,
    error,
    name,
  }: {
    label: string
    value: string
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
    show: boolean
    toggleShow: () => void
    error?: string
    name: string
  }) => (
    <div className='mb-4'>
      <Label htmlFor={name} className='text-sm font-medium'>
        {label}
      </Label>
      <div className='relative mt-1'>
        <Input
          type={show ? 'text' : 'password'}
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          className={error ? 'border-red-500 pr-10' : 'pr-10'}
        />
        <button
          type='button'
          onClick={toggleShow}
          className='absolute inset-y-0 right-3 flex items-center text-gray-600'
        >
          {show ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
      {error && <p className='text-red-500 text-xs mt-1'>{error}</p>}
    </div>
  )

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className='w-[420px] rounded-xl'>
        <DialogHeader>
          <DialogTitle className='text-2xl text-[#031F3A] font-semibold'>
            Change Password
          </DialogTitle>
          <DialogDescription className='text-[11px] text-[#AFAFAF]'>
            Make sure you remember the password to log in. Your new password
            must be different from previously used passwords.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <PasswordInput
            label='Current Password'
            name='currentPassword'
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            show={showCurrentPassword}
            toggleShow={() => setShowCurrentPassword(!showCurrentPassword)}
            error={errors.currentPassword}
          />

          <PasswordInput
            label='New Password'
            name='newPassword'
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            show={showNewPassword}
            toggleShow={() => setShowNewPassword(!showNewPassword)}
            error={errors.newPassword}
          />

          <PasswordInput
            label='Confirm Password'
            name='confirmPassword'
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            show={showConfirmPassword}
            toggleShow={() => setShowConfirmPassword(!showConfirmPassword)}
            error={errors.confirmPassword}
          />

          <DialogFooter className='mt-4 flex justify-end gap-4'>
            <Button
              type='button'
              variant='cancel'
              onClick={onClose}
              className='rounded-xl shadow-[0px_3px_6px_#031F3A59]'
            >
              Cancel
            </Button>
            <Button
              type='submit'
              variant='teal'
              className='rounded-xl shadow-[0px_3px_6px_#031F3A59] text-base'
            >
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default PasswordModalComponent

```

### constant/index.ts
```javascript
export const durations = [
  "30 minutes",
  "45 minutes",
  "1 hour (60 minutes)",
  "1.25 hour (75 minutes)",
  "1.5 hour (90 minutes)",
  "2 hour (120 minutes)",
  "2.5 hour (150 minutes)",
  "3 hour (180+ minutes)",
];

// Map each duration option to its minute value for calculation purposes
export const durationMapping: Record<string, number> = {
  "30 minutes": 30,
  "45 minutes": 45,
  "1 hour (60 minutes)": 60,
  "1.25 hour (75 minutes)": 75,
  "1.5 hour (90 minutes)": 90,
  "2 hour (120 minutes)": 120,
  "2.5 hour (150 minutes)": 150,
  "3 hour (180+ minutes)": 180,
};


export const availableLanguages = ["English", "French", "German", "Spanish", "Other"];

export const creditPackages = [
  { package: 500, cost: 750 },
  { package: 2500, cost: 3550 },
  { package: 15000, cost: 20000 },
  { package: 50000, cost: 60000 },
];

export const quantityOptions = [1, 2, 3, 4, 5, 6, 7, 8];
```

### context/AuthContext.tsx
```javascript
"use client"
import api from 'lib/api';
import React, { createContext, useContext, useState, ReactNode } from 'react';

// Define a User type
type User = {
  name: string;
  email?: string;
};

interface LoginResponse {
  user: User;
}
// Define the shape of the context
type AuthContextType = {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}


export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const login = async (email: string, password: string) => {
    const { data } = await api.post<LoginResponse>("/auth/login", {
      email,
      password,
    });
    setUser(data.user);
  };

  const logout = async  () => {
    await api.post<null>("/auth/logout");
    setUser(null);
  };

  const contextValue: AuthContextType = {
    user,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

```

### context/DashboardContext.tsx
```javascript
'use client'
import React, { createContext, useContext, useState, ReactNode } from 'react'

// Define the shape for dashboard stats (customize as needed)
type Stats = {
  [key: string]: any
}

type DashboardContextType = {
  stats: Stats
  updateStats: (newStats: Stats) => void
  viewProject: boolean
  setViewProject: React.Dispatch<React.SetStateAction<boolean>>
}

const DashboardContext = createContext<DashboardContextType | undefined>(
  undefined
)

export function useDashboard(): DashboardContextType {
  const context = useContext(DashboardContext)
  if (!context) {
    throw new Error('useDashboard must be used within a DashboardProvider')
  }
  return context
}

type DashboardProviderProps = {
  children: ReactNode
}

export function DashboardProvider({ children }: DashboardProviderProps) {
  const [stats, setStats] = useState<Stats>({})
  const [viewProject, setViewProject] = useState(false)

  const updateStats = (newStats: Stats) => {
    setStats(newStats)
  }

  const contextValue: DashboardContextType = {
    stats,
    updateStats,
    viewProject,
    setViewProject,
  }

  return (
    <DashboardContext.Provider value={contextValue}>
      {children}
    </DashboardContext.Provider>
  )
}

```

### context/GlobalContext.tsx
```javascript
"use client";
import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  Dispatch,
  SetStateAction,
} from "react";
import { IUser } from "../../shared/interface/UserInterface";

type GlobalContextType = {
  user: IUser | null;
  token: string | null;
  setUser: Dispatch<SetStateAction<IUser | null>>;
  setToken: Dispatch<SetStateAction<string | null>>;
};

// Create context with a default value that matches the type
const GlobalContext = createContext<GlobalContextType | undefined>(undefined);

// Custom hook for consuming the context
export function useGlobalContext(): GlobalContextType {
  const context = useContext(GlobalContext);
  if (!context) {
    throw new Error("useGlobalContext must be used within a GlobalProvider");
  }
  return context;
}

type GlobalProviderProps = {
  children: ReactNode;
};

export function GlobalProvider({ children }: GlobalProviderProps) {
  const [user, setUser] = useState<IUser | null>(() => {
    if (typeof window !== "undefined") {
      const savedUser = localStorage.getItem("user");
      return savedUser ? JSON.parse(savedUser) : null;
    }
    return null;
  });

  const [token, setToken] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("token") || null;
    }
    return null;
  });

  const value: GlobalContextType = {
    user,
    token,
    setUser,
    setToken,
  };

  return (
    <GlobalContext.Provider value={value}>{children}</GlobalContext.Provider>
  );
}

```

### context/MeetingContext.tsx
```javascript
"use client"
import React, { createContext, useContext, useState, ReactNode } from 'react';

// Define a Meeting type (customize the properties as needed)
type Meeting = {
  id: string;
  topic: string;
} | null;

type MeetingContextType = {
  meeting: Meeting;
  startMeeting: (meetingData: Exclude<Meeting, null>) => void;
  endMeeting: () => void;
};

const MeetingContext = createContext<MeetingContextType | undefined>(undefined);

export function useMeeting(): MeetingContextType {
  const context = useContext(MeetingContext);
  if (!context) {
    throw new Error('useMeeting must be used within a MeetingProvider');
  }
  return context;
}

type MeetingProviderProps = {
  children: ReactNode;
};

export function MeetingProvider({ children }: MeetingProviderProps) {
  const [meeting, setMeeting] = useState<Meeting>(null);

  const startMeeting = (meetingData: Exclude<Meeting, null>) => {
    setMeeting(meetingData);
  };

  const endMeeting = () => {
    setMeeting(null);
  };

  const contextValue: MeetingContextType = {
    meeting,
    startMeeting,
    endMeeting,
  };

  return (
    <MeetingContext.Provider value={contextValue}>
      {children}
    </MeetingContext.Provider>
  );
}

```

### lib/api.ts
```javascript
// lib/api.ts
import axios, {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
} from 'axios';

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8008';

const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // ← send your HttpOnly cookies automatically
});

interface FailedQueueItem {
  resolve: (value?: AxiosResponse<unknown>) => void;
  reject: (error: unknown) => void;
}

let isRefreshing = false;
let failedQueue: FailedQueueItem[] = [];

/**
 * Drain the queue: either retry all or reject all.
 */
function processQueue(error?: unknown): void {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve();
    }
  });
  failedQueue = [];
}

api.interceptors.response.use(
  (response: AxiosResponse<unknown>) => response,
  (error: AxiosError & {
    config?: AxiosRequestConfig & { _retry?: boolean };
  }) => {
    const originalRequest = error.config;
    const status = error.response?.status;

    if (status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;

      if (isRefreshing) {
        return new Promise<AxiosResponse<unknown>>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(() => api(originalRequest));
      }

      isRefreshing = true;

      return new Promise<AxiosResponse<unknown>>((resolve, reject) => {
        axios
          .post(
            `${BASE_URL}/auth/refresh`,
            null,
            { withCredentials: true }
          )
          .then(() => {
            processQueue();
            resolve(api(originalRequest));
          })
          .catch((refreshError: unknown) => {
            processQueue(refreshError);
            reject(refreshError);
          })
          .finally(() => {
            isRefreshing = false;
          });
      });
    }

    return Promise.reject(error);
  }
);

export default api;

```

### provider/Providers.tsx
```javascript
import { Toaster } from 'components/ui/sonner'
import { AuthProvider } from 'context/AuthContext'
import { DashboardProvider } from 'context/DashboardContext'
import { GlobalProvider } from 'context/GlobalContext'
import { MeetingProvider } from 'context/MeetingContext'
import React, { ReactNode } from 'react'

type ProvidersProps = {
  children: ReactNode
}

export default function Providers({ children }: ProvidersProps) {
  return (
    <GlobalProvider>
      <AuthProvider>
        <DashboardProvider>
          <MeetingProvider>
            {children}
            <Toaster richColors />
          </MeetingProvider>
        </DashboardProvider>
      </AuthProvider>
    </GlobalProvider>
  )
}

```


### provider/TanstackProviders.tsx
```javascript
// app/provider/TanstackProvider.tsx
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

const queryClient = new QueryClient();

export default function TanstackProvider({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      
    </QueryClientProvider>
  );
}

```

### utils/payment.ts
```javascript
// /utils/payment.ts
import axios from "axios";
import { IUser } from "@shared/interface/UserInterface";

// Retrieves the token from localStorage
export const getToken = (): string => {
  const userStr = localStorage.getItem("user");
  if (userStr) {
    try {
      const userObj = JSON.parse(userStr);
      return userObj.token || "";
    } catch (error) {
      console.log("Error in getToken function", error);
      return "";
    }
  }
  return "";
};

// Retrieves the user object from localStorage
export const getUser = (): IUser | null => {
  const userStr = localStorage.getItem("user");
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch (error) {
    console.log("Error in getUser function", error);
    return null;
  }
};

// Charges the customer using the saved card for a given amount (in cents)
export const chargeWithSavedCard = async (
  amountCents: number,
  totalCreditsNeeded: number
): Promise<IUser> => {
  const token = getToken();
  const user = getUser();

  if (!user || !user.stripeCustomerId) {
    throw new Error("No Stripe customer ID available");
  }

  const response = await axios.post(
    `${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/api/v1/payment/charge`,
    {
      customerId: user.stripeCustomerId,
      amount: amountCents,
      currency: "usd",
      userId: user._id,
      purchasedCredit: totalCreditsNeeded,
    },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  localStorage.setItem("user", JSON.stringify(response.data.data.user));
  
  return response.data;
};

```
```javascript

```
```javascript

```
```javascript

```
```javascript

```
```javascript

```
```javascript

```
```javascript

```
```javascript

```
```javascript

```
```javascript

```
```javascript

```
```javascript

```
```javascript

```
```javascript

```
```javascript

```
```javascript

```
```javascript

```
```javascript

```
```javascript

```
```javascript

```
```javascript

```
```javascript

```
```javascript

```
```javascript

```
```javascript

```
```javascript

```
```javascript

```
```javascript

```
```javascript

```
```javascript

```
```javascript

```
```javascript

```
```javascript

```
```javascript

```
```javascript

```
```javascript

```
```javascript

```
```javascript

```
```javascript

```
```javascript

```
```javascript

```
```javascript

```
```javascript

```
```javascript

```
```javascript

```
```javascript

```
```javascript

```
```javascript

```
```javascript

```
```javascript

```
```javascript

```
```javascript

```
```javascript

```
```javascript

```
```javascript

```
```javascript

```
```javascript

```
```javascript

```
```javascript

```
```javascript

```
```javascript

```
```javascript

```
```javascript

```
```javascript

```
```javascript

```
```javascript

```
```javascript

```
```javascript

```
```javascript

```
```javascript

```
```javascript

```
```javascript

```
```javascript

```
```javascript

```
```javascript

```