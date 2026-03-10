import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Create Exam",
    description: "Design and publish new exams",
};

export default function Layout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
