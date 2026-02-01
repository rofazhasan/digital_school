import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Student Dashboard | Digital School",
    description: "Manage your exams and view progress",
};

export default function Layout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
