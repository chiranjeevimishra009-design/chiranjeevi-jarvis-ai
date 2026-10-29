import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

const noteSchema = z.object({
  title: z.string().min(1).max(120),
  content: z.string().min(0).max(20000)
});

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const user = await getSessionUser(req);

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const note = await prisma.note.findFirst({
    where: { id: params.id, userId: user.id }
  });

  if (!note) {
    return NextResponse.json({ error: 'Note not found.' }, { status: 404 });
  }

  try {
    const body = noteSchema.parse(await req.json());
    const updated = await prisma.note.update({
      where: { id: note.id },
      data: {
        title: body.title,
        content: body.content
      }
    });

    return NextResponse.json({ note: updated });
  } catch (error) {
    return NextResponse.json({ error: 'Could not update note.' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const user = await getSessionUser(req);

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const note = await prisma.note.findFirst({
    where: { id: params.id, userId: user.id }
  });

  if (!note) {
    return NextResponse.json({ error: 'Note not found.' }, { status: 404 });
  }

  await prisma.note.delete({ where: { id: note.id } });
  return NextResponse.json({ success: true });
}
