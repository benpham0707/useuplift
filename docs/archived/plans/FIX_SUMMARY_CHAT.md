# Fix Summary: PIQ Workshop Chat Persistence

## Issue
The user reported that in the AI Essay Coach chatbox (PIQ Workshop), user messages would disappear after sending, leaving only the AI's responses visible. This prevented the user from seeing the "back and forth" conversation history.

## Root Cause
The issue was located in `ContextualWorkshopChat.tsx` within the `handleSendMessage` function.

1. `handleSendMessage` updates the chat state twice:
   - First, to add the user's message immediately.
   - Second, to add the AI's response after an async API call.

2. The `updateMessages` helper function was implemented to use the `chatMessages` variable from the component's scope.
   ```typescript
   // OLD Implementation
   const computed = newMessages(chatMessages); // chatMessages is captured from closure
   onMessagesChange(computed);
   ```

3. Because `handleSendMessage` is an async function, the `chatMessages` variable captured in the closure became stale by the time the second update (AI response) occurred.
   - The first update added the user message.
   - The second update used the *original* (stale) message list, appended the AI response, and overwrote the state.
   - Result: The user message was effectively deleted from the state.

## Fix
Refactored `ContextualWorkshopChat.tsx` to support functional state updates correctly.

1. Updated `ContextualWorkshopChatProps` interface to allow passing a functional update to `onMessagesChange`.
   ```typescript
   onMessagesChange?: (messages: ChatMessage[] | ((prev: ChatMessage[]) => ChatMessage[])) => void;
   ```

2. Updated `updateMessages` to pass the functional update directly to the parent's state setter (`setChatMessages` in `PIQWorkshop.tsx`), instead of resolving it locally with stale data.
   ```typescript
   const updateMessages = (newMessages: ChatMessage[] | ((prev: ChatMessage[]) => ChatMessage[])) => {
     if (onMessagesChange) {
       // Pass the function or value directly to the parent setter
       onMessagesChange(newMessages);
     } else {
       setInternalMessages(newMessages);
     }
   };
   ```

3. This ensures that React's state setter always applies the update to the *latest* state, preserving the user's message when the AI response is added.

## Verification
- `ContextualWorkshopChat` is used in `PIQWorkshop.tsx` with `useState` setter, which supports the functional update pattern.
- Other usages (`ExtracurricularWorkshopFinal.tsx`) also use standard `useState` or don't provide `onMessagesChange` (falling back to internal state), so they remain compatible.
- The fix addresses the specific "disappearing user message" behavior described by the user.

