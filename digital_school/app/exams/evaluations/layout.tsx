import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Exam Evaluations",
    description: "View and grade exam submissions",
};

export default function Layout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
