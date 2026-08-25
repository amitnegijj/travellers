import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The floating dev badge overlaps the mobile bottom tab bar, which makes the
  // Home tab untappable at phone widths. Off so the real UI is testable.
  devIndicators: false,
};

export default nextConfig;
