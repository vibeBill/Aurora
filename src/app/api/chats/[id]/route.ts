// app/api/chats/[id]/route.ts
import { Message } from "@/types";
import { sql } from "@vercel/postgres";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  context: { params: { id: string } }
) {
  try {
    const { id } = await context.params;
    const { rows } = await sql`
      SELECT c.*, m.id as message_id, m.content, m.role, m.timestamp
      FROM chats c
      LEFT JOIN messages m ON c.id = m.chat_id
      WHERE c.id = ${id}
      ORDER BY m.timestamp ASC
    `;

    const chat = {
      id: rows[0].id,
      title: rows[0].title,
      createdAt: rows[0].created_at,
      messages: rows
        .map((row) => ({
          id: row.message_id,
          content: row.content,
          role: row.role,
          timestamp: row.timestamp,
        }))
        .filter((message) => message.id),
    };

    return NextResponse.json(chat);
  } catch (error) {
    return NextResponse.json({ error }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  context: { params: { id: string } }
) {
  try {
    const { id } = await context.params;
    const message: Message = await request.json();

    // 确保timestamp是有效的日期
    const timestamp = new Date(message.timestamp).toISOString();

    const { rows } = await sql`
      INSERT INTO messages (
        id,
        chat_id,
        content,
        role,
        timestamp
      )
      VALUES (
        ${message.id},
        ${id},
        ${message.content},
        ${message.role},
        ${timestamp}
      )
      RETURNING *
    `;

    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error("Error saving message:", error);
    return NextResponse.json(
      { error: "Failed to save message" },
      { status: 500 }
    );
  }
}
