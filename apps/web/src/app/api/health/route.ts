import { NextResponse } from 'next/server';

export function GET() {
  return NextResponse.json({
    ok: true,
    service: 'kernelon-web',
    runtime: 'next-app-router',
  });
}
