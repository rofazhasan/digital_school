import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Teacher Dashboard | Digital School",
    description: "Manage exams, students, and question banks",
};

export default function Layout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
