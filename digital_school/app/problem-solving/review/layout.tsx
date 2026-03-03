import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Review Session",
    description: "Review exam answers and explanations",
};

export default function Layout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
