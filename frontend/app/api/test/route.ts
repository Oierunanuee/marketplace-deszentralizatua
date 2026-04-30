import { NextResponse } from "next/server";

export async function GET() {
  const jwt = process.env.PINATA_JWT;
  return NextResponse.json({ 
    jwtExists: !!jwt,
    jwtLength: jwt?.length,
    jwtStart: jwt?.slice(0, 20),
  });
}