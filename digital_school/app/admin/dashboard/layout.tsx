import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Admin Dashboard | Digital School",
    description: "System administration and user management",
};

export default function Layout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
