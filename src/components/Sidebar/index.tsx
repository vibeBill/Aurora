// components/Sidebar.tsx
import { useEffect, useState } from "react";
import { Chat } from "@/types";
import styles from "./style.module.scss";

interface SidebarProps {
  activeChat: string | null;
  chats: Chat[];
  setActiveChat: (chatId: string) => void;
  onNewChat: () => void;
}

const Sidebar = ({
  activeChat,
  chats,
  setActiveChat,
  onNewChat,
}: SidebarProps) => {
  return (
    <div className={styles.sidebar}>
      <button onClick={onNewChat} className={styles.new_chat_button}>
        New Chat
      </button>
      <div className={styles.chat_list}>
        {chats.map((chat) => (
          <div
            key={chat.id}
            className={`${styles.chat_item} ${
              chat.id === activeChat ? styles.active : ""
            }`}
            onClick={() => setActiveChat(chat.id)}
          >
            <span className={styles.chat_title}>{chat.title}</span>
            <span className={styles.chat_date}>
              {new Date(chat.created_at).toLocaleDateString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Sidebar;
