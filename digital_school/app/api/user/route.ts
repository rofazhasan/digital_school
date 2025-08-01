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
    if (authData.user.role === 'SUPER_USER' && userToDelete.role === 'SUPER_USER' && authData.user.id !== userToDelete.id) {
      return NextResponse.json({ error: 'Superusers cannot delete other superusers' }, { status: 403 });
    }
    // Delete related profiles
    await prismadb.studentProfile.deleteMany({ where: { userId: id } });
    await prismadb.teacherProfile.deleteMany({ where: { userId: id } });
    // Delete user
    await prismadb.user.delete({ where: { id } });
    return NextResponse.json({ message: 'User deleted' });
  } catch (error) {
    console.error('User delete error:', error);
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
} 