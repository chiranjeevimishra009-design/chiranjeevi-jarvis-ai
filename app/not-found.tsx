import { NextResponse } from 'next/server';

export default function NotFound() {
  return NextResponse.json({ error: 'Not found' }, { status: 404 });
}
