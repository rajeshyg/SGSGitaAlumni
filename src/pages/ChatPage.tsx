import { ChatWindow } from '../components/chat/ChatWindow';

/**
 * Chat Page
 * Main page for the chat/messaging system
 * Uses ChatWindow component for full chat functionality
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
