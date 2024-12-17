// app/api/chats/route.ts
import { sql } from "@vercel/postgres";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const { rows } = await sql`
      SELECT * FROM chats 
      ORDER BY created_at DESC
    `;
    return NextResponse.json(rows);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST() {
  try {
    const id = crypto.randomUUID();
    const title = `New Chat ${new Date().toLocaleString()}`;

    const { rows } = await sql`
      INSERT INTO chats (id, title, created_at)
      VALUES (${id}, ${title}, NOW())
      RETURNING *
    `;

    return NextResponse.json(rows[0]);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
