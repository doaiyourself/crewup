/** @type {import('next').NextConfig} */
const nextConfig = {
  // 모노레포 공유 패키지(TS 소스) 트랜스파일
  transpilePackages: ["@crewup/core"],
};

export default nextConfig;
