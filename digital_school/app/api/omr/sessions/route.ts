/**
 * OMR Scan Session API — Phase 3-B
 *
 * GET  /api/omr/sessions          — list sessions (paginated, filter by examId/status)
 * POST /api/omr/sessions          — create new session
 * PATCH /api/omr/sessions/[id]    — update session (close, publish)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTokenFromRequest } from '@/lib/auth';
import { publishSessionResults } from '@/lib/omr/result-writer';

// ─── GET: List sessions ──────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const token = await getTokenFromRequest(req);
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const examId    = searchParams.get('examId')   || undefined;
    const status    = searchParams.get('status')   || undefined;
    const page      = parseInt(searchParams.get('page')  || '1', 10);
    const limit     = parseInt(searchParams.get('limit') || '20', 10);
    const skip      = (page - 1) * limit;

    const where: any = {};
    if (examId) where.examId = examId;
    if (status) where.status = status;

    const [sessions, total] = await Promise.all([
      prisma.oMRScanSession.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          scans: {
            select: {
              id: true,
              status: true,
              totalScore: true,
              maxScore: true,
              rollNumber: true,
              registrationNo: true,
              createdAt: true,
            },
          },
        },
      }),
      prisma.oMRScanSession.count({ where }),
    ]);

    // Annotate each session with counts derived from scan records
    const annotated = sessions.map((session) => {
      const scans    = session.scans ?? [];
      const approved = scans.filter((s) => s.status === 'APPROVED' || s.status === 'SYNCED').length;
      const review   = scans.filter((s) => s.status === 'REVIEW_REQUIRED').length;
      const failed   = scans.filter((s) => s.status === 'FAILED').length;
      const pending  = scans.filter((s) => s.status === 'PENDING').length;

      return {
        id:             session.id,
        sessionName:    session.sessionName,
        examinerId:     session.examinerId,
        examId:         session.examId,
        status:         session.status,
        totalFiles:     session.totalFiles,
        processedFiles: session.processedFiles,
        isCompleted:    session.isCompleted,
        completedAt:    session.completedAt,
        publishedAt:    session.publishedAt,
        publishedCount: session.publishedCount,
        createdAt:      session.createdAt,
        counts:         { total: scans.length, approved, review, failed, pending },
      };
    });

    return NextResponse.json({
      sessions: annotated,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ─── POST: Create new session ────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const token = await getTokenFromRequest(req);
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { sessionName, examId } = body;

    if (!sessionName) {
      return NextResponse.json({ error: 'sessionName is required' }, { status: 400 });
    }

    const session = await prisma.oMRScanSession.create({
      data: {
        sessionName,
        examinerId: token.user.id,
        examId:     examId || null,
        status:     'OPEN',
      },
    });

    return NextResponse.json({ success: true, session }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ─── PATCH: Close or publish a session ───────────────────────────────────────
export async function PATCH(req: NextRequest) {
  try {
    const token = await getTokenFromRequest(req);
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { id, action } = body; // action: 'close' | 'publish' | 'reopen'

    if (!id || !action) {
      return NextResponse.json({ error: 'id and action are required' }, { status: 400 });
    }

    const session = await prisma.oMRScanSession.findUnique({ where: { id } });
    if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 });

    if (action === 'publish') {
      // Bulk-publish all APPROVED scans in this session
      const publishedCount = await publishSessionResults(id, prisma);

      const updated = await prisma.oMRScanSession.update({
        where: { id },
        data: {
          status:         'PUBLISHED',
          isCompleted:    true,
          completedAt:    session.completedAt ?? new Date(),
          publishedAt:    new Date(),
          publishedCount,
        },
      });

      return NextResponse.json({ success: true, session: updated, publishedCount });
    }

    if (action === 'close') {
      const updated = await prisma.oMRScanSession.update({
        where: { id },
        data: { status: 'CLOSED', isCompleted: true, completedAt: new Date() },
      });
      return NextResponse.json({ success: true, session: updated });
    }

    if (action === 'reopen') {
      const updated = await prisma.oMRScanSession.update({
        where: { id },
        data: { status: 'OPEN', isCompleted: false, completedAt: null },
      });
      return NextResponse.json({ success: true, session: updated });
    }

    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
