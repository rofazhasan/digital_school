import { NextRequest, NextResponse } from "next/server";
import { getTokenFromRequest } from "@/lib/auth";
import { getDatabaseClient } from "@/lib/db-init";
import bcrypt from 'bcryptjs';

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
    const results = [];
    for (const user of body) {
      try {
        const { name, email, phone, role, class: className, section } = user;
        if (!name || !email || !role) throw new Error('Missing required fields');
        // Check if user exists
        const existing = await prismadb.user.findUnique({ where: { email } });
        if (existing) throw new Error('User with this email already exists');
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
            password: await bcrypt.hash('TempPass123!', 12), // Hash the temp password
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
    if (!id) return NextResponse.json({ error: 'User id is required' }, { status: 400 });
    // Fetch the user to be deleted
    const userToDelete = await prismadb.user.findUnique({ where: { id } });
    if (!userToDelete) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    // Prevent admin from deleting other admins or superusers
    if (authData.user.role === 'ADMIN' && (userToDelete.role === 'ADMIN' || userToDelete.role === 'SUPER_USER')) {
      return NextResponse.json({ error: 'Admins cannot delete other admins or superusers' }, { status: 403 });
    }
    // Prevent superuser from deleting other superusers
    // Prevent superuser from deleting other superusers (except self, but logic above prevents that too mostly)
    if (authData.user.role === 'SUPER_USER' && userToDelete.role === 'SUPER_USER' && authData.user.id !== userToDelete.id) {
      return NextResponse.json({ error: 'Superusers cannot delete other superusers' }, { status: 403 });
    }

    const adminId = authData.user.id;

    // Perform deletion in a transaction to handle all dependencies
    await prismadb.$transaction(async (tx) => {
      // 1. Reassign Content (Preserve academic assets)
      // Assessments
      await tx.question.updateMany({ where: { createdById: id }, data: { createdById: adminId } });
      await tx.exam.updateMany({ where: { createdById: id }, data: { createdById: adminId } });
      await tx.exam.updateMany({ where: { assignedById: id }, data: { assignedById: null } }); // Unassign exams assigned *by* this user
      await tx.questionBank.updateMany({ where: { createdById: id }, data: { createdById: adminId } });
      await tx.examSet.updateMany({ where: { createdById: id }, data: { createdById: adminId } });

      // Educational
      await tx.notice.updateMany({ where: { postedById: id }, data: { postedById: adminId } });
      await tx.attendance.updateMany({ where: { teacherId: id }, data: { teacherId: adminId } }); // Maintain attendance history

      // Profiles Relations (Nullify before profile deletion to avoid constraint errors)
      // Note: TeacherProfile deletion usually cascades to relations if configured, but we nullify to be safe/keep data
      // Questions linked to teacher profile
      // We can't query by teacherProfileId easily without fetching profile first, or we assume teacherProfile gets deleted and we just need to ensure Question doesn't block it.
      // Actually, Question.teacherProfileId is optional. If we delete TeacherProfile, we rely on SetNull or manual nullify.
      // Let's manually nullify to be safe.
      const teacherProfile = await tx.teacherProfile.findUnique({ where: { userId: id } });
      if (teacherProfile) {
        await tx.question.updateMany({ where: { teacherProfileId: teacherProfile.id }, data: { teacherProfileId: null } });
        await tx.questionBank.updateMany({ where: { teacherId: teacherProfile.id }, data: { teacherId: null } });
      }

      // 2. Clear Operational Dependencies
      await tx.examEvaluationAssignment.deleteMany({ where: { evaluatorId: id } }); // Remove pending evaluations
      await tx.examEvaluationAssignment.updateMany({ where: { assignedById: id }, data: { assignedById: adminId } });
      await tx.examSubmissionDrawing.updateMany({ where: { evaluatorId: id }, data: { evaluatorId: adminId } });

      // 3. Delete Personal Data & Logs
      await tx.log.deleteMany({ where: { userId: id } });
      await tx.notification.deleteMany({ where: { userId: id } });
      await tx.exportJob.deleteMany({ where: { triggeredById: id } });
      await tx.aIActivity.deleteMany({ where: { userId: id } });
      await tx.billing.deleteMany({ where: { userId: id } });
      await tx.activityAudit.updateMany({ where: { userId: id }, data: { userId: null } }); // Keep audit trail anonymous
      await tx.badge.deleteMany({ where: { earnedById: id } }); // Delete badges earned by this user

      // Result Reviews (as reviewer)
      await tx.resultReview.updateMany({ where: { reviewedById: id }, data: { reviewedById: adminId } });

      // Chat Sessions (Must delete messages first)
      const sessions = await tx.chatSession.findMany({ where: { userId: id }, select: { id: true } });
      if (sessions.length > 0) {
        await tx.chatMessage.deleteMany({ where: { sessionId: { in: sessions.map(s => s.id) } } });
        await tx.chatSession.deleteMany({ where: { userId: id } });
      }

      // 4. Delete Profiles & Related Student Data
      // If user has a student profile, we must clean up its dependencies due to lack of CASCADE in schema
      const studentProfile = await tx.studentProfile.findUnique({ where: { userId: id } });
      if (studentProfile) {
        const studentId = studentProfile.id;
        // Academic Records
        // Note: We delete these because they are strictly tied to the student's performance. 
        // Reassigning them doesn't make sense.
        await tx.examSubmissionDrawing.deleteMany({ where: { studentId } });
        await tx.examSubmission.deleteMany({ where: { studentId } });
        await tx.result.deleteMany({ where: { studentId } });
        await tx.admitCard.deleteMany({ where: { studentId } });
        await tx.oMRSheet.deleteMany({ where: { studentId } });
        await tx.examStudentMap.deleteMany({ where: { studentId } });
        await tx.badge.deleteMany({ where: { studentId } }); // Badges linked to student profile
        await tx.resultReview.deleteMany({ where: { studentId } });

        await tx.studentProfile.delete({ where: { id: studentId } });
      }

      await tx.teacherProfile.deleteMany({ where: { userId: id } });

      // 5. Delete User
      await tx.user.delete({ where: { id } });
    });

    return NextResponse.json({ message: 'User deleted successfully' });
  } catch (error: any) {
    console.error('User delete error:', error);
    return NextResponse.json({ error: `Failed to delete user: ${error.message}` }, { status: 500 });
  }
} 