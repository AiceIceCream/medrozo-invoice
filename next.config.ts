import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    '192.168.200.181:3000', 
    '192.168.200.181',
    '192.168.200.177'
  ]
};

export default nextConfig;