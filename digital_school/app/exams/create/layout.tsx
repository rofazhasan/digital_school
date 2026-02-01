import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Create Exam | Digital School",
    description: "Design and publish new exams",
};

export default function Layout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
