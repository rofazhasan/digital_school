import { NextRequest, NextResponse } from "next/server";
import { getTokenFromRequest } from "@/lib/auth";
import { getDatabaseClient } from "@/lib/db-init";
import bcrypt from 'bcryptjs';
import { sendEmail } from "@/lib/email";
import { WelcomeEmail } from "@/components/emails/WelcomeEmail";

export async function GET(request: NextRequest) {
  try {
    const authData = await getTokenFromRequest(request);

    if (!authData) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    // Get database client with automatic initialization
    const prismadb = await getDatabaseClient();

    // If ?all=true and admin/super_user, return all users
    const url = new URL(request.url);
    const all = url.searchParams.get('all');
    if (all === 'true' && (authData.user.role === 'ADMIN' || authData.user.role === 'SUPER_USER')) {
      const users = await prismadb.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          studentProfile: {
            select: {
              roll: true,
              class: { select: { name: true, section: true } }
            }
          }
        }
      });
      return NextResponse.json({
        users: users.map((u: any) => ({
          id: u.id,
          name: u.name,
          email: u.email,
          phone: u.phone || '',
          role: u.role,
          class: u.role === 'STUDENT' ? u.studentProfile?.class?.name || '' : undefined,
          section: u.role === 'STUDENT' ? u.studentProfile?.class?.section || '' : undefined,
          roll: u.role === 'STUDENT' ? u.studentProfile?.roll || '' : undefined,
        }))
      });
    }

    return NextResponse.json({
      user: authData.user,
    });
  } catch (error) {
    console.error("Get user error:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authData = await getTokenFromRequest(request);
    if (!authData || (authData.user.role !== 'ADMIN' && authData.user.role !== 'SUPER_USER')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get database client with automatic initialization
    const prismadb = await getDatabaseClient();

    const body = await request.json();
    if (!Array.isArray(body)) {
      return NextResponse.json({ error: 'Expected an array of users' }, { status: 400 });
    }
    const results: { success: boolean, error?: string, user?: { id: string, name: string, email: string | null, role: any } }[] = [];
    for (const user of body) {
      try {
        const { name, email, phone, role, class: className, section } = user;
        if (!name || (!email && !phone) || !role) throw new Error('Missing required fields: Name, Role, and either Email or Phone are required.');

        // Check if user exists (by email OR phone)
        if (email) {
          const existingEmail = await prismadb.user.findUnique({ where: { email } });
          if (existingEmail) throw new Error(`User with email ${email} already exists`);
        }
        if (phone) {
          const existingPhone = await prismadb.user.findUnique({ where: { phone } });
          if (existingPhone) throw new Error(`User with phone ${phone} already exists`);
        }
        let classId = undefined;
        if (role === 'STUDENT' && className) {
          let classRecord = await prismadb.class.findFirst({ where: { name: className, section: section || '' } });
          if (!classRecord) {
            let institute = await prismadb.institute.findFirst();
            if (!institute) {
              institute = await prismadb.institute.create({ data: { name: 'Default Institute', email: 'default@institute.com' } });
            }
            classRecord = await prismadb.class.create({ data: { name: className, section: section || '', instituteId: institute.id } });
          }
          classId = classRecord.id;
        }
        const created = await prismadb.user.create({
          data: {
            name,
            email,
            phone, // Add phone to user creation
            password: await bcrypt.hash(user.password || 'TempPass123!', 12), // Use provided password or default
            role,
            instituteId: authData.user.instituteId,
            studentProfile: role === 'STUDENT' && classId ? {
              create: {
                roll: `ROLL${Date.now()}`,
                registrationNo: `REG${Date.now()}`,
                guardianName: name,
                guardianPhone: email,
                class: { connect: { id: classId } },
              }
            } : undefined,
          }
        });
        results.push({ success: true, user: { id: created.id, name: created.name, email: created.email, role: created.role } });
      } catch (err: any) {
        results.push({ success: false, error: err.message, user });
      }
    }

    // Proactive: Send Welcome Emails for successfully created users in background
    const sendBulkWelcomeEmails = async () => {
      try {
        const institute = await prismadb.institute.findFirst({
          select: { name: true, address: true, phone: true, logoUrl: true }
        });

        const emailPromises = results.filter(r => r.success && r.user?.email).map(async (res) => {
          // Find the original user data to get the raw password (if any)
          const originalUser = body.find(u => u.email === res.user?.email);
          const tempPassword = originalUser?.password || 'TempPass123!';

          return sendEmail({
            to: res.user!.email!,
            subject: `Welcome to ${institute?.name || 'Digital School'}`,
            react: WelcomeEmail({
              firstName: res.user!.name.split(' ')[0],
              institute: institute as any,
              temporaryPassword: tempPassword
            }) as any
          });
        });

        await Promise.allSettled(emailPromises);
      } catch (err) {
        console.error('Failed to send bulk welcome emails:', err);
      }
    };

    sendBulkWelcomeEmails();

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Bulk user add error:', error);
    return NextResponse.json({ error: 'Failed to add users' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const authData = await getTokenFromRequest(request);
    if (!authData || (authData.user.role !== 'ADMIN' && authData.user.role !== 'SUPER_USER')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get database client with automatic initialization
    const prismadb = await getDatabaseClient();

    const body = await request.json();
    const { id, name, email, role, class: className, section } = body;
    if (!id) return NextResponse.json({ error: 'User id is required' }, { status: 400 });

    // Check Permissions for Edit
    const userToEdit = await prismadb.user.findUnique({ where: { id } });
    if (!userToEdit) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    if (authData.user.role === 'ADMIN') {
      if (userToEdit.role === 'ADMIN' || userToEdit.role === 'SUPER_USER') {
        return NextResponse.json({ error: 'Admins cannot edit other admins or superusers' }, { status: 403 });
      }
      // Also prevent promoting someone TO Admin or Super User if you are just an Admin (optional but good practice)
      if (role === 'ADMIN' || role === 'SUPER_USER') {
        return NextResponse.json({ error: 'Admins cannot promote users to Admin or Super User' }, { status: 403 });
      }
    }

    // Update user
    const updatedUser = await prismadb.user.update({
      where: { id },
      data: { name, email, role },
    });
    // If student, update class
    if (role === 'STUDENT' && className) {
      // Find or create class
      let classRecord = await prismadb.class.findFirst({ where: { name: className, section: section || '' } });
      if (!classRecord) {
        // Use first institute as fallback
        let institute = await prismadb.institute.findFirst();
        if (!institute) {
          institute = await prismadb.institute.create({ data: { name: 'Default Institute', email: 'default@institute.com' } });
        }
        classRecord = await prismadb.class.create({ data: { name: className, section: section || '', instituteId: institute.id } });
      }
      await prismadb.studentProfile.updateMany({
        where: { userId: id },
        data: { classId: classRecord.id },
      });
    }
    return NextResponse.json({ message: 'User updated' });
  } catch (error) {
    console.error('User update error:', error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authData = await getTokenFromRequest(request);
    if (!authData || (authData.user.role !== 'ADMIN' && authData.user.role !== 'SUPER_USER')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get database client with automatic initialization
    const prismadb = await getDatabaseClient();

    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    const idsParam = url.searchParams.get('ids');

    let idsToDelete: string[] = [];
    if (idsParam) {
      idsToDelete = idsParam.split(',').filter(Boolean);
    } else if (id) {
      idsToDelete = [id];
    }

    if (idsToDelete.length === 0) {
      return NextResponse.json({ error: 'User id(s) required' }, { status: 400 });
    }

    const adminId = authData.user.id;
    const results = { success: 0, failed: 0, errors: [] as string[] };

    // Function to delete a single user
    const deleteSingleUser = async (targetId: string) => {
      // Fetch user
      const userToDelete = await prismadb.user.findUnique({ where: { id: targetId } });
      if (!userToDelete) throw new Error(`User ${targetId} not found`);

      // Check Permissions
      if (authData.user.role === 'ADMIN' && (userToDelete.role === 'ADMIN' || userToDelete.role === 'SUPER_USER')) {
        throw new Error('Admins cannot delete other admins or superusers');
      }
      if (authData.user.role === 'SUPER_USER' && userToDelete.role === 'SUPER_USER' && authData.user.id !== targetId) {
        throw new Error('Superusers cannot delete other superusers');
      }

      // Phase 1: Reassign Assets (Non-transactional)
      try {
        await Promise.all([
          prismadb.question.updateMany({ where: { createdById: targetId }, data: { createdById: adminId } }),
          prismadb.exam.updateMany({ where: { createdById: targetId }, data: { createdById: adminId } }),
          prismadb.exam.updateMany({ where: { assignedById: targetId }, data: { assignedById: null } }),
          prismadb.questionBank.updateMany({ where: { createdById: targetId }, data: { createdById: adminId } }),
          prismadb.examSet.updateMany({ where: { createdById: targetId }, data: { createdById: adminId } }),
          prismadb.notice.updateMany({ where: { postedById: targetId }, data: { postedById: adminId } }),
          prismadb.attendance.updateMany({ where: { teacherId: targetId }, data: { teacherId: adminId } }),
          prismadb.examEvaluationAssignment.updateMany({ where: { assignedById: targetId }, data: { assignedById: adminId } }),
          prismadb.examSubmissionDrawing.updateMany({ where: { evaluatorId: targetId }, data: { evaluatorId: adminId } }),
          prismadb.resultReview.updateMany({ where: { reviewedById: targetId }, data: { reviewedById: adminId } })
        ]);

        const teacherProfile = await prismadb.teacherProfile.findUnique({ where: { userId: targetId } });
        if (teacherProfile) {
          await Promise.all([
            prismadb.question.updateMany({ where: { teacherProfileId: teacherProfile.id }, data: { teacherProfileId: null } }),
            prismadb.questionBank.updateMany({ where: { teacherId: teacherProfile.id }, data: { teacherId: null } })
          ]);
        }
      } catch (err) {
        console.error(`Error reassigning assets for ${targetId}:`, err);
        // Aborting is safer to ensure we don't delete a user whose assets weren't reassigned.
        throw new Error(`Failed to reassign assets for ${targetId}. Deletion aborted.`);
      }

      // Phase 2: Delete Dependencies & User (Transactional)
      await prismadb.$transaction(async (tx) => {
        await tx.examEvaluationAssignment.deleteMany({ where: { evaluatorId: targetId } });
        await tx.log.deleteMany({ where: { userId: targetId } });
        await tx.notification.deleteMany({ where: { userId: targetId } });
        await tx.exportJob.deleteMany({ where: { triggeredById: targetId } });
        await tx.aIActivity.deleteMany({ where: { userId: targetId } });
        await tx.billing.deleteMany({ where: { userId: targetId } });
        await tx.activityAudit.updateMany({ where: { userId: targetId }, data: { userId: null } });
        await tx.badge.deleteMany({ where: { earnedById: targetId } });

        const sessions = await tx.chatSession.findMany({ where: { userId: targetId }, select: { id: true } });
        if (sessions.length > 0) {
          await tx.chatMessage.deleteMany({ where: { sessionId: { in: sessions.map(s => s.id) } } });
          await tx.chatSession.deleteMany({ where: { userId: targetId } });
        }

        const studentProfile = await tx.studentProfile.findUnique({ where: { userId: targetId } });
        if (studentProfile) {
          const studentId = studentProfile.id;
          await tx.examSubmissionDrawing.deleteMany({ where: { studentId } });
          await tx.examSubmission.deleteMany({ where: { studentId } });
          await tx.result.deleteMany({ where: { studentId } });
          await tx.admitCard.deleteMany({ where: { studentId } });
          await tx.oMRSheet.deleteMany({ where: { studentId } });
          await tx.examStudentMap.deleteMany({ where: { studentId } });
          await tx.badge.deleteMany({ where: { studentId } });
          await tx.resultReview.deleteMany({ where: { studentId } });
          await tx.studentProfile.delete({ where: { id: studentId } });
        }

        await tx.teacherProfile.deleteMany({ where: { userId: targetId } });
        await tx.user.delete({ where: { id: targetId } });
      }, { maxWait: 10000, timeout: 20000 });
    };

    // Iterate through IDs sequentially
    for (const targetId of idsToDelete) {
      try {
        await deleteSingleUser(targetId);
        results.success++;
      } catch (error: any) {
        console.error(`Error deleting user ${targetId}:`, error);
        results.failed++;
        results.errors.push(error.message || `Failed to delete ${targetId}`);
      }
    }

    if (results.failed > 0 && results.success === 0) {
      return NextResponse.json({ error: 'Failed to delete selected users', details: results.errors }, { status: 500 });
    }

    return NextResponse.json({
      message: `Successfully deleted ${results.success} user(s).${results.failed > 0 ? ` Failed to delete ${results.failed}.` : ''}`,
      results
    });

  } catch (error: any) {
    console.error('User delete error:', error);
    return NextResponse.json({ error: `Failed to delete user: ${error.message}` }, { status: 500 });
  }
}