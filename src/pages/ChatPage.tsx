import { ChatWindow } from '../components/chat/ChatWindow';

/**
 * Chat Page
 * Main page for the chat/messaging system
 * Uses ChatWindow component for full chat functionality
 *
 * ChatWindow provides:
 * - Two-panel layout (conversation list + messages)
 * - Responsive design (mobile-first with desktop support)
 * - Real-time Socket.IO integration
 * - Message input with auto-resize
 * - Typing indicators, read receipts, reactions
 * - Handles both wrapped and unwrapped API responses
 */
export default function ChatPage() {
  return (
    <div className="h-screen bg-background overflow-hidden">
      <div className="h-full max-w-7xl mx-auto p-2 sm:p-4">
        <ChatWindow />
      </div>
    </div>
  );
}
