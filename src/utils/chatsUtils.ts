import { Message } from "@/types";

export function limitChatHistory(
  messages: Message[],
  maxMessages: number = 10
) {
  return messages.slice(-maxMessages);
}

export function truncateMessage(content: string, maxLength: number = 500) {
  return content.length > maxLength
    ? content.substring(0, maxLength) + "..."
    : content;
}
