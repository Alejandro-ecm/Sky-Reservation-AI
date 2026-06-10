import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "https://skyreservation.ai";
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: ["/dashboard/", "/api/", "/onboarding/"] },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
