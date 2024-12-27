// app/page.tsx
"use client";

import { useEffect, useState } from "react";
import ChatWindow from "@/components/ChatWindow";
import Sidebar from "@/components/Sidebar";
import { Chat } from "@/types";

export default function Home() {
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [chats, setChats] = useState<Chat[]>([]);

  useEffect(() => {
    fetchChats();
  }, []);

  const fetchChats = async () => {
    try {
      const response = await fetch("/api/chats");
      const data = await response.json();
      setChats(data);
    } catch (error) {
      console.error("Failed to fetch chats:", error);
    }
  };

  const createNewChat = async (mode: "chat" | "generate") => {
    try {
      const response = await fetch("/api/chats", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ mode }),
      });
      const chat = await response.json();

      setActiveChat(chat.id);
      setChats([...chats, chat]);
    } catch (error) {
      console.error("Failed to create new chat:", error);
    }
  };

  return (
    <div className="app-container">
      <Sidebar
        activeChat={activeChat}
        chats={chats}
        setActiveChat={setActiveChat}
        onNewChat={createNewChat}
      />
      <main className="main-content">
        {activeChat ? (
          <ChatWindow chatId={activeChat} />
        ) : (
          <div className="welcome-message">
            Select a chat or start a new one
          </div>
        )}
      </main>
    </div>
  );
}
