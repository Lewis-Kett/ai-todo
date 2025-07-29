import type { NextConfig } from "next";
import { withBaml } from "@boundaryml/baml-nextjs-plugin";

const nextConfig: NextConfig = {
  // BAML plugin configuration is handled by withBaml wrapper
};

export default withBaml()(nextConfig);
