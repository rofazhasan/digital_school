import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "OMR Scanner | Digital School",
    description: "Scan and grade optical mark recognition sheets",
};

export default function Layout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
