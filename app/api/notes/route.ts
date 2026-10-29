import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

const noteSchema = z.object({
  title: z.string().min(1).max(120),
  content: z.string().min(1).max(20000)
});

export async function GET(req: Request) {
  const user = await getSessionUser(req);

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get('q')?.trim() ?? '';

  const notes = await prisma.note.findMany({
    where: {
      userId: user.id,
      OR: search
        ? [
            { title: { contains: search } },
            { content: { contains: search } }
          ]
        : undefined
    },
    orderBy: { updatedAt: 'desc' }
  });

  return NextResponse.json({ notes });
}

export async function POST(req: Request) {
  const user = await getSessionUser(req);

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = noteSchema.parse(await req.json());
    const note = await prisma.note.create({
      data: {
        userId: user.id,
        title: body.title,
        content: body.content
      }
    });

    return NextResponse.json({ note });
  } catch (error) {
    return NextResponse.json({ error: 'Could not save note.' }, { status: 500 });
  }
}
