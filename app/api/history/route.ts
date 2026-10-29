import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(req: Request) {
  const user = await getSessionUser(req);

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get('q')?.trim() ?? '';

  const conversations = await prisma.conversation.findMany({
    where: {
      userId: user.id,
      OR: search
        ? [
            { title: { contains: search } },
            { messages: { some: { content: { contains: search } } } }
          ]
        : undefined
    },
    include: {
      messages: {
        orderBy: { createdAt: 'asc' }
      }
    },
    orderBy: { updatedAt: 'desc' }
  });

  return NextResponse.json({ conversations });
}
