// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "the-flex-bucket.s3.amazonaws.com",
        pathname: "**", // allow all paths
      },
    ],
  },
};

module.exports = nextConfig;
