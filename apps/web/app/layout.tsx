import "../src/index.css";
import localFont from "next/font/local";
import { NavigationProgressClient } from "../src/components/NavigationProgress";

const nineteenFiftyFive = localFont({
  src: [
    { path: "../src/fonts/1955-Thin.otf", weight: "100", style: "normal" },
    { path: "../src/fonts/1955-Thin-Italic.otf", weight: "100", style: "italic" },
    { path: "../src/fonts/1955-Light.otf", weight: "300", style: "normal" },
    { path: "../src/fonts/1955-Light-Italic.otf", weight: "300", style: "italic" },
    { path: "../src/fonts/1955-Medium.otf", weight: "500", style: "normal" },
    { path: "../src/fonts/1955-Medium-Italic.otf", weight: "500", style: "italic" },
    { path: "../src/fonts/1955-Black.otf", weight: "900", style: "normal" },
    { path: "../src/fonts/1955-Black-Italic.otf", weight: "900", style: "italic" },
  ],
  variable: "--font-1955",
  display: "swap",
});

export const metadata = {
  title: "Runpane",
  description: "Agent Passport and Prism AX for trustworthy AI workers.",
  icons: {
    icon: "/icon.svg",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={nineteenFiftyFive.variable}>
      <body>
        <NavigationProgressClient />
        {children}
      </body>
    </html>
  );
}
