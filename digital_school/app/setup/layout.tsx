import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Initial Setup | Digital School",
    description: "Configure your school settings",
};

export default function Layout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
