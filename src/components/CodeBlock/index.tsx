import { useCallback, useState } from "react";
import styles from "./style.module.scss";

const CopyButton = ({ text }: { text: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [text]);

  return (
    <button
      className={styles.copy_button}
      onClick={handleCopy}
      aria-label="Copy code"
    >
      {copied ? (
        <svg viewBox="0 0 24 24" width="20" height="20">
          <path
            fill="currentColor"
            d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"
          />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" width="20" height="20">
          <path
            fill="currentColor"
            d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"
          />
        </svg>
      )}
    </button>
  );
};

const CodeBlock = ({ children }: { children: string }) => {
  return (
    <div className={styles.code_block_wrapper}>
      <CopyButton text={children} />
      <pre>
        <code>{children}</code>
      </pre>
    </div>
  );
};

export default CodeBlock;
