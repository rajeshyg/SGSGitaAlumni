import { ChatWindow } from '../components/chat/ChatWindow';

/**
 * Chat Page
 * Main page for the chat/messaging system
 * Uses ChatWindow component for full chat functionality
 */
export default function ChatPage() {
  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <ChatWindow />
      </div>
    </div>
  );
}
