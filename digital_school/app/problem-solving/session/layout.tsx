import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Problem Solving | Digital School",
    description: "Practice and solve mathematical problems",
};

export default function Layout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
