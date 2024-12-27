// components/Sidebar.tsx
import { Chat } from "@/types";
import styles from "./style.module.scss";
import { useState } from "react";
import Image from "next/image";

interface SidebarProps {
  activeChat: string | null;
  chats: Chat[];
  setActiveChat: (chatId: string) => void;
  onNewChat: (mode: "chat" | "generate") => void;
}

const Sidebar = ({
  activeChat,
  chats,
  setActiveChat,
  onNewChat,
}: SidebarProps) => {
  const [showModal, setShowModal] = useState(false);

  const handleModeSelect = (mode: "chat" | "generate") => {
    onNewChat(mode);
    setShowModal(false);
  };

  return (
    <div className={styles.sidebar}>
      <button
        onClick={() => setShowModal(true)}
        className={styles.new_chat_button}
      >
        新建对话
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
            <span className={styles.chat_title}>
              {chat.title} ({chat.mode})
            </span>
            <span className={styles.chat_date}>
              {new Date(chat.created_at).toLocaleDateString()}
            </span>
          </div>
        ))}
      </div>

      {showModal && (
        <div
          className={styles.modal_overlay}
          onClick={() => setShowModal(false)}
        >
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3>选择对话模式</h3>
            <div className={styles.mode_options}>
              <button
                className={styles.mode_button}
                onClick={() => handleModeSelect("chat")}
              >
                <Image src="/chat.svg" alt="Chat" width={24} height={24} />
                <span>Chat</span>
                <p>基础对话模式，适用于问答和交谈</p>
              </button>
              <button
                className={styles.mode_button}
                onClick={() => handleModeSelect("generate")}
              >
                <Image
                  src="/generate.svg"
                  alt="Generate"
                  width={24}
                  height={24}
                />
                <span>Generate</span>
                <p>生成模式，适用于创作和内容生成</p>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
