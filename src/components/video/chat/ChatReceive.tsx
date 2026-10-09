"use client";
import React, { useEffect, useRef, useState } from "react";
import { ChatMessage } from ".";
import { ChatUserInterface } from "../../../helpers";
import { ChatSafetyHelper } from "@/helpers/ChatSafetyHelper";
import { ConversationStore } from "@churchapps/apphelper";
import type { MessageInterface, ConversationInterface } from "@churchapps/helpers";

interface Props { conversationId: string, user: ChatUserInterface }

export const ChatReceive: React.FC<Props> = (props) => {
  const chatReceiveRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<MessageInterface[]>([]);
  const [, setBlockVersion] = useState(0);

  // Hide senders this viewer blocked (on this device, or as a signed-in member).
  useEffect(() => {
    ChatSafetyHelper.loadMemberBlocks();
    return ChatSafetyHelper.subscribe(() => setBlockVersion((v) => v + 1));
  }, []);

  useEffect(() => {
    if (!props.conversationId) return;
    const unsubscribe = ConversationStore.subscribe(props.conversationId, (conv: ConversationInterface) => {
      setMessages(conv.messages ?? []);
    });
    return unsubscribe;
  }, [props.conversationId]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (chatReceiveRef.current) {
      chatReceiveRef.current.scrollTo(0, chatReceiveRef.current.scrollHeight);
    }
  }, [messages]);

  return (
    <div ref={chatReceiveRef} id="chatReceive">
      {messages.filter((m) => !ChatSafetyHelper.isMessageBlocked(m as any)).map((m, i) => (
        <ChatMessage key={m.id ?? i} message={m} conversationId={props.conversationId} user={props.user} />
      ))}
    </div>
  );
};
