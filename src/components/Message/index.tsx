// components/Message.tsx
import { Message } from "@/types";
import ReactMarkdown from "react-markdown";
import CodeBlock from "../CodeBlock";
import styles from "./style.module.scss";

const components = {
  code: ({ children }: { children: string }) => (
    <CodeBlock>{children}</CodeBlock>
  ),
};

interface MessageProps {
  message: Message;
}

const MessageComponent = ({ message }: MessageProps) => (
  <div className={`${styles.message} ${styles[message.role]}`}>
    <div className={styles.message_content}>
      <ReactMarkdown components={components}>{message.content}</ReactMarkdown>
    </div>
    <div className={styles.message_timestamp}>
      {new Date(message.timestamp).toLocaleTimeString()}
    </div>
  </div>
);

export default MessageComponent;
