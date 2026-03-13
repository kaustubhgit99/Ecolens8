/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: false,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "behdmwslebogluoenfnu.supabase.co",
        port: "",
        pathname: "/storage/v1/object/**",
      },
    ],
  },
};

module.exports = nextConfig;
