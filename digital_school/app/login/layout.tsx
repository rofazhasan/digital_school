import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Login | Digital School",
    description: "Sign in to you account",
};

export default function Layout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
