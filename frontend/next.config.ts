import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    domains: [
      "interview-234343.s3.ap-southeast-2.amazonaws.com",
      "amplify365aitech.s3.ap-south-1.amazonaws.com",
    ],
  },
};

export default nextConfig;
