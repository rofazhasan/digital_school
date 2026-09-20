import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: {
    template: "%s | Student Corner",
    default: "Student Corner — Personal Daily Arena & Focus OS",
  },
  description: "Personal student productivity and consistency operating system",
};

export default function StudentCornerRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
