import { NextRequest, NextResponse } from 'next/server';
import { getTokenFromRequest } from '@/lib/auth';
import { getDatabaseClient } from '@/lib/db-init';

export async function GET() {
  try {
    const prismadb = await getDatabaseClient();
    const classes = await prismadb.class.findMany({
      select: {
        id: true,
        name: true,
        section: true,
        _count: {
          select: { students: true }
        },
        institute: {
          select: {
            id: true,
            name: true,
            email: true,
            address: true,
            logoUrl: true
          }
        }
      },
      orderBy: [{ name: 'asc' }, { section: 'asc' }],
    });
    return NextResponse.json({ classes });
  } catch (error) {
    console.error('Get classes error:', error);
    return NextResponse.json({ error: 'Failed to fetch classes' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authData = await getTokenFromRequest(request);
    if (!authData || (authData.user.role !== 'ADMIN' && authData.user.role !== 'SUPER_USER')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const prismadb = await getDatabaseClient();
    const body = await request.json();
    const { name, section } = body;

    if (!name || !section) {
      return NextResponse.json({ error: 'Name and section are required' }, { status: 400 });
    }

    // Check if class already exists
    const existingClass = await prismadb.class.findFirst({
      where: { name, section }
    });

    if (existingClass) {
      return NextResponse.json({ error: 'Class already exists' }, { status: 409 });
    }

    // Get or create institute
    let institute = await prismadb.institute.findFirst();
    if (!institute) {
      institute = await prismadb.institute.create({
        data: {
          name: 'Default Institute',
          email: 'default@institute.com',
        }
      });
    }

    // Create new class
    const newClass = await prismadb.class.create({
      data: {
        name,
        section,
        instituteId: institute.id,
      },
      select: { id: true, name: true, section: true }
    });

    return NextResponse.json(newClass, { status: 201 });
  } catch (error) {
    console.error('Create class error:', error);
    return NextResponse.json({ error: 'Failed to create class' }, { status: 500 });
  }
} 