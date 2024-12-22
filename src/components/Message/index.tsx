// components/Message.tsx
import { Message } from "@/types";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import CodeBlock from "../CodeBlock";
import styles from "./style.module.scss";

const components = {
  code: ({
    className,
    children,
  }: {
    className?: string;
    children?: React.ReactNode;
  }) => {
    const isInline = typeof children === "string" && !children.includes("\n");

    return (
      <CodeBlock inline={isInline} className={className}>
        {children as string}
      </CodeBlock>
    );
  },
  p: ({ children }: { children: React.ReactNode }) => (
    <span className={styles.paragraph}>{children}</span>
  ),
};

interface MessageProps {
  message: Message;
}

const MessageComponent = ({ message }: MessageProps) => {
  const isThinking = message.content === "thinking";
  return (
    <div className={`${styles.message} ${styles[message.role]}`}>
      <div className={styles.message_content}>
        {isThinking ? (
          <div className={styles.thinking}>
            ✨ Aurora正在思考
            <span className={styles.dot}></span>
            <span className={styles.dot}></span>
            <span className={styles.dot}></span>
          </div>
        ) : (
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
            {message.content}
          </ReactMarkdown>
        )}
      </div>
      <div className={styles.message_timestamp}>
        {new Date(message.timestamp).toLocaleTimeString()}
      </div>
    </div>
  );
};

export default MessageComponent;
