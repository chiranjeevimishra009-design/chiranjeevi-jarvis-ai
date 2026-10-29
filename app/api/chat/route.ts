import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { generateAIReply } from '@/lib/ai';
import { titleFromMessage } from '@/lib/utils';

const chatSchema = z.object({
  message: z.string().min(1).max(5000),
  language: z.string().optional(),
  conversationId: z.string().optional().nullable()
});

export async function POST(req: Request) {
  const user = await getSessionUser(req);

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = chatSchema.parse(await req.json());
    const locale = body.language === 'hi' ? 'hi' : 'en';

    let conversation = null;
    if (body.conversationId) {
      conversation = await prisma.conversation.findFirst({
        where: {
          id: body.conversationId,
          userId: user.id
        }
      });
    }

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          userId: user.id,
          title: titleFromMessage(body.message)
        }
      });
    }

    const userMessage = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: 'user',
        content: body.message,
        language: locale
      }
    });

    const recentHistory = await prisma.message.findMany({
      where: { conversationId: conversation.id },
      orderBy: { createdAt: 'asc' },
      take: 20
    });

    const historyText = recentHistory.map((item) => item.content);
    const assistantReply = await generateAIReply(body.message, locale, historyText);

    const assistantMessage = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: 'assistant',
        content: assistantReply,
        language: locale
      }
    });

    const updatedTitle = conversation.title === 'New Chat' ? titleFromMessage(body.message) : conversation.title;

    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { title: updatedTitle }
    });

    await prisma.memory.create({
      data: {
        userId: user.id,
        content: `User preference / context: ${body.message} :: Assistant answer: ${assistantReply}`
      }
    });

    return NextResponse.json({
      conversationId: conversation.id,
      userMessage,
      assistantMessage,
      reply: assistantReply
    });
  } catch (error) {
    return NextResponse.json({ error: 'Chat failed.' }, { status: 500 });
  }
}
