import { getCurrentUser } from "@/lib/auth";
import { ProfileSettings } from "@/components/dashboard/ProfileSettings";
import { redirect } from "next/navigation";

export const dynamic = 'force-dynamic';

export default async function AdminProfilePage() {
    const user = await getCurrentUser();

    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_USER')) {
        redirect("/login");
    }

    return (
        <div className="p-4 md:p-8">
            <ProfileSettings user={user} />
        </div>
    );
}
