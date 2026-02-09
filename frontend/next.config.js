/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Proxy RPC and REST requests through Next.js to avoid CORS issues.
  // The browser hits /rpc and /rest on the same origin; Next.js forwards
  // them to the actual chain endpoints running on different ports.
  async rewrites() {
    const rpcTarget = process.env.NEXT_PUBLIC_RPC_ENDPOINT || "http://localhost:26657";
    const restTarget = process.env.NEXT_PUBLIC_REST_ENDPOINT || "http://localhost:1317";

    return [
      {
        source: "/rpc/:path*",
        destination: `${rpcTarget}/:path*`,
      },
      {
        source: "/rest/:path*",
        destination: `${restTarget}/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
