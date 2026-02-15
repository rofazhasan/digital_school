import { NextRequest, NextResponse } from 'next/server';
import prismadb from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: instituteId } = await params;
    
    const classes = await prismadb.class.findMany({
      where: {
        instituteId: instituteId
      },
      select: {
        id: true,
        name: true,
        section: true,
        _count: {
          select: {
            students: true
          }
        }
      },
      orderBy: [
        { name: 'asc' },
        { section: 'asc' }
      ]
    });

    return NextResponse.json({
      classes: classes.map(cls => ({
        id: cls.id,
        name: cls.name,
        section: cls.section,
        displayName: `${cls.name} - ${cls.section}`,
        studentCount: cls._count.students
      }))
    });
  } catch (error) {
    console.error('Error fetching classes by institute:', error);
    return NextResponse.json(
      { error: 'Failed to fetch classes' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: instituteId } = await params;
    const body = await request.json();
    const { name, section } = body;

    if (!name || !section) {
      return NextResponse.json(
        { error: 'Name and section are required' },
        { status: 400 }
      );
    }

    // Check if class already exists in this institute
    const existingClass = await prismadb.class.findFirst({
      where: {
        name,
        section,
        instituteId
      }
    });

    if (existingClass) {
      return NextResponse.json(
        { error: 'Class already exists in this institute' },
        { status: 409 }
      );
    }

    // Create new class
    const newClass = await prismadb.class.create({
      data: {
        name,
        section,
        instituteId
      },
      select: {
        id: true,
        name: true,
        section: true
      }
    });

    return NextResponse.json({
      class: {
        ...newClass,
        displayName: `${newClass.name} - ${newClass.section}`,
        studentCount: 0
      }
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating class:', error);
    return NextResponse.json(
      { error: 'Failed to create class' },
      { status: 500 }
    );
  }
} 