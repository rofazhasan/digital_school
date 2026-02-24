import { getCurrentUser } from "@/lib/auth";
import { ProfileSettings } from "@/components/dashboard/ProfileSettings";
import { redirect } from "next/navigation";

export const dynamic = 'force-dynamic';

export default async function TeacherProfilePage() {
    const user = await getCurrentUser();

    if (!user || user.role !== 'TEACHER') {
        redirect("/login");
    }

    return (
        <div className="p-4 md:p-8">
            <ProfileSettings user={user} />
        </div>
    );
}
