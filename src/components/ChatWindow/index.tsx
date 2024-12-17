// components/ChatWindow.tsx
import { useState, useEffect, useRef } from "react";
import { Chat, Message } from "@/types";
import MessageComponent from "../Message";
import SearchBar from "../SearchBar";
import styles from "./style.module.scss";
import { limitChatHistory, truncateMessage } from "@/utils/chatsUtils";

interface ChatWindowProps {
  chatId: string;
}

const ChatWindow = ({ chatId }: ChatWindowProps) => {
  const [chat, setChat] = useState<Chat | null>(null);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [useInternet, setUseInternet] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    fetchChat();
  }, [chatId]);

  useEffect(() => {
    scrollToBottom();
  }, [chat?.messages]);

  const fetchChat = async () => {
    const response = await fetch(`/api/chats/${chatId}`);
    const data = await response.json();
    setChat(data);
  };

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);

    try {
      const userQuery = query;
      setQuery("");

      const userMessage: Message = {
        id: crypto.randomUUID(),
        content: userQuery,
        role: "user",
        timestamp: new Date(),
      };

      const processedHistory = limitChatHistory(chat?.messages || []).map(
        (msg) => ({
          ...msg,
          content: truncateMessage(msg.content),
        })
      );

      await fetch(`/api/chats/${chatId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userMessage),
      });

      setChat((prev) =>
        prev
          ? {
              ...prev,
              messages: [...prev.messages, userMessage],
            }
          : null
      );

      const response = await fetch(`/api/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: userQuery,
          useInternet,
          chatHistory: processedHistory,
        }),
      });

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No reader available");

      let assistantMessage = "";
      const assistantMessageId = crypto.randomUUID();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = new TextDecoder().decode(value);
        const lines = text.split("\n").filter((line) => line.trim());

        for (const line of lines) {
          try {
            const data = JSON.parse(line);
            if (data.type === "token") {
              assistantMessage += data.data;
              setChat((prev) => {
                if (!prev) return null;
                const messages = [...prev.messages];
                const lastMessage = messages[messages.length - 1];
                if (lastMessage.role === "assistant") {
                  messages[messages.length - 1] = {
                    ...lastMessage,
                    content: assistantMessage,
                  };
                } else {
                  messages.push({
                    id: assistantMessageId,
                    content: assistantMessage,
                    role: "assistant",
                    timestamp: new Date(),
                  });
                }
                return { ...prev, messages };
              });
            }
          } catch (e) {
            console.error("Parse error:", e);
          }
        }
      }
      await fetch(`/api/chats/${chatId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: assistantMessageId,
          content: assistantMessage,
          role: "assistant",
          timestamp: new Date(),
        }),
      });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (!chat) return <div>Loading...</div>;

  return (
    <div className={styles.chat_window}>
      <div className={styles.messages_container}>
        {chat.messages.map((message) => (
          <MessageComponent key={message.id} message={message} />
        ))}
        <div ref={messagesEndRef} />
      </div>
      <SearchBar
        query={query}
        setQuery={setQuery}
        useInternet={useInternet}
        setUseInternet={setUseInternet}
        handleSearch={handleSearch}
        loading={loading}
      />
    </div>
  );
};

export default ChatWindow;
