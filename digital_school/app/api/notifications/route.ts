import { NextRequest, NextResponse } from 'next/server';
import { getTokenFromRequest } from '@/lib/auth';
import db from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const tokenData = await getTokenFromRequest(req);
    
    if (!tokenData || !tokenData.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get notifications for the current user
    const notifications = await (db as any).notification.findMany({
      where: {
        userId: tokenData.user.id,
        isRead: false
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({
      notifications
    });

  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const tokenData = await getTokenFromRequest(req);
    
    if (!tokenData || !tokenData.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { notificationId } = await req.json();

    if (!notificationId) {
      return NextResponse.json({ error: 'Notification ID is required' }, { status: 400 });
    }

    // Mark notification as read
    await (db as any).notification.update({
      where: {
        id: notificationId,
        userId: tokenData.user.id
      },
      data: {
        isRead: true
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Notification marked as read'
    });

  } catch (error) {
    console.error('Error marking notification as read:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 