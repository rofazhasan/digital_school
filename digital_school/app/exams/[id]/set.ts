import { NextRequest, NextResponse } from 'next/server';
import prismadb from '@/lib/db';
import { getTokenFromRequest } from '@/lib/auth';

// ... existing POST and GET handlers ...

// DELETE: Remove all sets for an exam or a single set if setId is provided
export async function DELETE(request: NextRequest, context: { params: { id: string } }) {
  try {
    const auth = await getTokenFromRequest(request);
    if (!auth || !auth.user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    const examId = context.params.id;
    const url = new URL(request.url);
    const setId = url.searchParams.get('setId');
    if (setId) {
      await prismadb.examSet.delete({ where: { id: setId } });
      return NextResponse.json({ success: true, deletedSetId: setId });
    } else {
      await prismadb.examSet.deleteMany({ where: { examId } });
      return NextResponse.json({ success: true });
    }
  } catch (error) {
    console.error('Failed to delete exam set(s):', error);
    return NextResponse.json({ error: 'Failed to delete exam set(s)' }, { status: 500 });
  }
} 