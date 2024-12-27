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
  } catch (error: unknown) {
    // Narrow the error to an instance of Error
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(
      { error: "An unknown error occurred" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { mode } = await request.json();
    const id = crypto.randomUUID();
    const title = `New Chat ${new Date().toLocaleString()}`;

    const { rows } = await sql`
      INSERT INTO chats (id, title, mode, created_at)
      VALUES (${id}, ${title}, ${mode}, NOW())
      RETURNING *
    `;

    return NextResponse.json(rows[0]);
  } catch (error: unknown) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(
      { error: "An unknown error occurred" },
      { status: 500 }
    );
  }
}
