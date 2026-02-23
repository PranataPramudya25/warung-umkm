import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

// Mantra biar data selalu fresh tiap di-refresh
export const dynamic = 'force-dynamic'; 

const prisma = new PrismaClient();

export async function GET() {
  try {
    const data = await prisma.product.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: "Gagal ambil data" }, { status: 500 });
  }
}