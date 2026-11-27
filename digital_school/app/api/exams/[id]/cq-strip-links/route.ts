import { NextRequest, NextResponse } from 'next/server';
import prismadb from '@/lib/db';
import { getTokenFromRequest } from '@/lib/auth';

const STAFF_ROLES = ['SUPER_USER', 'ADMIN', 'TEACHER'];

function normalizeSerial(raw: unknown): string {
  return String(raw || '').trim().toUpperCase().slice(0, 64);
}

/**
 * GET /api/exams/[id]/cq-strip-links
 * Returns all multi-device CQ Top-Cover Part 1 <-> Part 2 serial link records & live pairing stats.
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getTokenFromRequest(request);
    if (!auth?.user || !STAFF_ROLES.includes(auth.user.role)) {
      return NextResponse.json({ error: 'Forbidden: Staff role required' }, { status: auth?.user ? 403 : 401 });
    }

    const { id: examId } = await context.params;
    const links = await (prismadb as any).cqStripLink.findMany({
      where: { examId },
      orderBy: { updatedAt: 'desc' },
      take: 5000,
    });

    let paired = 0;
    let waitingPart2 = 0;
    let waitingPart1 = 0;
    for (const r of links) {
      if (r.status === 'PAIRED') paired++;
      else if (r.status === 'WAITING_PART2') waitingPart2++;
      else if (r.status === 'WAITING_PART1') waitingPart1++;
    }

    return NextResponse.json({
      success: true,
      links,
      stats: { total: links.length, paired, waitingPart2, waitingPart1 },
    });
  } catch (error) {
    console.error('Failed to fetch CQ strip links:', error);
    return NextResponse.json({ error: 'Failed to fetch CQ strip links' }, { status: 500 });
  }
}

/**
 * POST /api/exams/[id]/cq-strip-links
 * Atomically records Part 1 (Student Identity) or Part 2 (Examiner Marks) for a serial.
 * Automatically transitions status to 'PAIRED' across any number of concurrent scanning stations.
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getTokenFromRequest(request);
    if (!auth?.user || !STAFF_ROLES.includes(auth.user.role)) {
      return NextResponse.json({ error: 'Forbidden: Staff role required' }, { status: auth?.user ? 403 : 401 });
    }

    const { id: examId } = await context.params;
    const body = await request.json();
    const serial = normalizeSerial(body?.serial);
    const part = String(body?.part || '').toUpperCase();

    if (!serial || (part !== 'PART1' && part !== 'PART2')) {
      return NextResponse.json({ error: 'Valid serial and part (PART1 | PART2) are required' }, { status: 400 });
    }

    const now = new Date();

    const record = await prismadb.$transaction(async (tx: any) => {
      const existing = await tx.cqStripLink.findUnique({
        where: { examId_serial: { examId, serial } },
      });

      if (part === 'PART1') {
        const rollNumber = body.rollNumber ? String(body.rollNumber).trim() : existing?.rollNumber || null;
        const registrationNo = body.registrationNo ? String(body.registrationNo).trim() : existing?.registrationNo || null;
        const studentId = body.studentId ? String(body.studentId).trim() : existing?.studentId || null;
        const studentName = body.studentName ? String(body.studentName).trim() : existing?.studentName || null;
        const hasPart2 = existing?.obtainedMarksCQ !== null && existing?.obtainedMarksCQ !== undefined;
        const status = rollNumber && hasPart2 ? 'PAIRED' : 'WAITING_PART2';

        return tx.cqStripLink.upsert({
          where: { examId_serial: { examId, serial } },
          create: {
            examId,
            serial,
            rollNumber,
            registrationNo,
            studentId,
            studentName,
            status,
            part1ScannedAt: now,
          },
          update: {
            rollNumber,
            registrationNo,
            studentId,
            studentName,
            status,
            part1ScannedAt: now,
          },
        });
      } else {
        const rawMarks = Number(body.obtainedMarksCQ ?? 0);
        const headMarks =
          body.headExaminerMarks !== undefined && body.headExaminerMarks !== null && Number(body.headExaminerMarks) > 0
            ? Number(body.headExaminerMarks)
            : null;
        const effectiveMarks = headMarks !== null ? headMarks : rawMarks;
        const examinerCode = body.examinerCode ? String(body.examinerCode).trim() : existing?.examinerCode || null;
        const hasPart1 = Boolean(existing?.rollNumber);
        const status = hasPart1 ? 'PAIRED' : 'WAITING_PART1';

        return tx.cqStripLink.upsert({
          where: { examId_serial: { examId, serial } },
          create: {
            examId,
            serial,
            obtainedMarksCQ: effectiveMarks,
            headExaminerMarks: headMarks,
            examinerCode,
            status,
            part2ScannedAt: now,
          },
          update: {
            obtainedMarksCQ: effectiveMarks,
            headExaminerMarks: headMarks,
            examinerCode,
            status,
            part2ScannedAt: now,
          },
        });
      }
    });

    return NextResponse.json({
      success: true,
      record,
      isPaired: record.status === 'PAIRED',
    });
  } catch (error) {
    console.error('Failed to upsert CQ strip link:', error);
    return NextResponse.json({ error: 'Failed to save CQ strip link' }, { status: 500 });
  }
}

/**
 * DELETE /api/exams/[id]/cq-strip-links?serial=...
 * Clears a specific serial (or all links for this exam if serial is omitted).
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getTokenFromRequest(request);
    if (!auth?.user || !['SUPER_USER', 'ADMIN'].includes(auth.user.role)) {
      return NextResponse.json({ error: 'Forbidden: Admin role required' }, { status: auth?.user ? 403 : 401 });
    }

    const { id: examId } = await context.params;
    const serial = normalizeSerial(new URL(request.url).searchParams.get('serial'));

    if (serial) {
      await (prismadb as any).cqStripLink.deleteMany({ where: { examId, serial } });
    } else {
      await (prismadb as any).cqStripLink.deleteMany({ where: { examId } });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete CQ strip links:', error);
    return NextResponse.json({ error: 'Failed to delete CQ strip links' }, { status: 500 });
  }
}
