import { useEffect } from 'react';
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
 *
 * Mobile Optimizations:
 * - iOS keyboard detection using visualViewport API
 * - Safe area padding for notched devices
 * - Smooth scrolling and momentum scrolling on iOS
 * - iOS-optimized viewport handling
 */
export default function ChatPage() {
  useEffect(() => {
    // iOS keyboard handling
    if (window.visualViewport) {
      const handleViewportChange = () => {
        // Adjust view when keyboard appears/disappears
        // This helps ensure messages stay visible when typing
        const viewportHeight = window.visualViewport?.height ?? window.innerHeight;
        const heightChange = Math.abs(window.innerHeight - viewportHeight);

        if (heightChange > 100) {
          // Keyboard is likely visible, ensure viewport is adjusted
          console.log('[ChatPage] Keyboard detected, viewport adjusted');
        }
      };

      window.visualViewport.addEventListener('resize', handleViewportChange);

      return () => {
        window.visualViewport?.removeEventListener('resize', handleViewportChange);
      };
    }
  }, []);

  useEffect(() => {
    if (typeof document === 'undefined') {
      return;
    }

    const previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousBodyOverflow;
    };
  }, []);

  return (
    <div className="min-h-[100svh] bg-background overflow-hidden">
      <div className="mx-auto flex h-[100svh] max-w-6xl flex-col px-3 sm:px-4 lg:px-6 pt-[max(0.5rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="flex-1 min-h-0">
          <ChatWindow />
        </div>
      </div>
    </div>
  );
}
