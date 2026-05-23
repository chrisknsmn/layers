import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { DotGridHorizon } from "./components/dot-grid-horizon";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Layers",
  description: "Layers",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <DotGridHorizon />
        <div
          aria-hidden
          className="pointer-events-none fixed left-6 top-6 z-10 text-primary"
          style={{ color: "var(--primary)" }}
        >
          <svg
            width="29"
            height="27"
            viewBox="0 0 29 27"
            fill="currentColor"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fill="currentColor"
              d="M14 23.9648C21.732 23.9648 28 24.6364 28 25.4648C28 26.2933 21.732 26.9648 14 26.9648C6.26801 26.9648 0 26.2933 0 25.4648C0 24.6364 6.26801 23.9648 14 23.9648ZM15 19.9648C22.732 19.9648 29 20.6364 29 21.4648C29 22.2933 22.732 22.9648 15 22.9648C7.26801 22.9648 1 22.2933 1 21.4648C1 20.6364 7.26801 19.9648 15 19.9648ZM12.5107 18.916C6.46702 18.7499 2 18.1642 2 17.4648C2 16.739 6.81129 16.133 13.2031 15.9941L12.5107 18.916ZM13.459 14.9141C7.44155 14.746 3 14.1622 3 13.4648C3 12.741 7.78484 12.1361 14.1504 11.9951L13.459 14.9141ZM14.4062 10.9131C8.41561 10.7431 4 10.1602 4 9.46484C4 8.74307 8.75795 8.1403 15.0967 7.99707L14.4062 10.9131ZM15.3545 6.91113C9.3902 6.73926 5 6.15815 5 5.46484C5 4.74508 9.73158 4.14342 16.0439 3.99805L15.3545 6.91113ZM16.3018 2.91016C10.3643 2.73637 6 2.15611 6 1.46484C6 0.747082 10.7053 0.147497 16.9912 0L16.3018 2.91016Z"
            />
          </svg>
        </div>
        {children}
      </body>
    </html>
  );
}
