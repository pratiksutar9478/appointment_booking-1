import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
  title: "AppointCare — Hospital Appointment Booking",
  description:
    "Book appointments with top doctors and receive instant WhatsApp/SMS confirmations and reminders.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: { fontSize: "14px" },
          }}
        />
      </body>
    </html>
  );
}
