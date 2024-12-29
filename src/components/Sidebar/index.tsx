// components/Sidebar.tsx
import { Chat } from "@/types";
import styles from "./style.module.scss";
import { useState } from "react";
import Image from "next/image";
import classNames from "classnames";

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
  const [isCollapsed, setIsCollapsed] = useState(true);

  const handleModeSelect = (mode: "chat" | "generate") => {
    onNewChat(mode);
    setShowModal(false);
  };

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div
      className={classNames(styles.sidebar, {
        [styles.collapsed]: isCollapsed,
      })}
    >
      <div className={styles.burger} onClick={toggleSidebar}>
        <div className={styles.line}></div>
        <div className={styles.line}></div>
        <div className={styles.line}></div>
      </div>

      <button
        onClick={() => setShowModal(true)}
        className={styles.new_chat_button}
      >
        <Image
          src="/plus.svg"
          alt="New"
          width={20}
          height={20}
          className={styles.icon}
        />
        <span>新建对话</span>
      </button>

      <div className={styles.chat_list}>
        {chats.map((chat) => (
          <div
            key={chat.id}
            className={classNames(styles.chat_item, {
              [styles.active]: chat.id === activeChat,
            })}
            onClick={() => setActiveChat(chat.id)}
          >
            <Image
              src={chat.mode === "chat" ? "/chat.svg" : "/generate.svg"}
              alt={chat.mode}
              width={20}
              height={20}
              className={styles.chat_icon}
            />
            <div>
              <span className={styles.chat_title}>
                {chat.title} ({chat.mode})
              </span>
              <span className={styles.chat_date}>
                {new Date(chat.created_at).toLocaleDateString()}
              </span>
            </div>
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
