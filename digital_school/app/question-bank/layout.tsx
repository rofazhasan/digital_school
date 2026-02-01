import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Question Bank | Digital School",
    description: "Manage and create questions for exams",
};

export default function Layout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
