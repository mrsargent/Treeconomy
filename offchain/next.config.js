// import type { NextConfig } from "next";

// const nextConfig: NextConfig = {

//   output: 'standalone',
//   reactStrictMode: true,
//   webpack: (config) => {
//     config.experiments = {
//       asyncWebAssembly: true,
//       topLevelAwait: true,
//       layers: true
//     };
//     // config.module.rules.push({
//     //   test: /\.wasm$/,
//     //   type: 'webassembly/async',
//     // });
//     return config
//   },
//     env:{
//     BLOCKFROST_KEY: process.env.BLOCKFROST_KEY,
//     API_URL: process.env.API_URL,
//     NETWORK: process.env.NETWORK
//   }
// };

// export default nextConfig;

// /** @type {import('next').NextConfig} */
// const nextConfig = {

//   output: 'standalone',
//   reactStrictMode: true,
//   webpack: (config) => {
//     config.experiments = {
//       asyncWebAssembly: true,
//       topLevelAwait: true,
//       layers: true
//     }
//     return config
//   },
//     env:{
//     BLOCKFROST_KEY: process.env.BLOCKFROST_KEY,
//     API_URL: process.env.API_URL,
//     NETWORK: process.env.NETWORK
//   }
// }

// module.exports = nextConfig

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  reactStrictMode: true,
  webpack: (config) => {
    config.experiments = {
      asyncWebAssembly: true,
      topLevelAwait: true,
      layers: true,
    };

    return config;
  },
  env: {
    BLOCKFROST_KEY: process.env.BLOCKFROST_KEY,
    API_URL: process.env.API_URL,
    NETWORK: process.env.NETWORK,
  },
};

module.exports = nextConfig;
