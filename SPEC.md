# Cipher - Neural Synthesis AI Assistant

## Project Overview

- **Project Name**: Cipher
- **Type**: Web App + CLI synchronized AI assistant
- **Core Functionality**: Minimalist AI chat with cross-platform identity sync between Web and CLI
- **Target Users**: Developers and technical users seeking a high-end AI assistant

## UI/UX Specification

### Layout Structure

**Page Sections:**
- **Header**: Fixed top bar with logo, sync status indicator, user avatar
- **Chat Area**: Main message list with scrollable container
- **Input Area**: Fixed bottom with textarea and send button

**Responsive Breakpoints:**
- Mobile: < 640px (single column, full width)
- Tablet: 640px - 1024px (centered container, max 720px)
- Desktop: > 1024px (centered container, max 800px)

### Visual Design

**Color Palette:**
- Background Primary: `#0A0A0A` (pitch-black)
- Background Secondary: `#141414` (elevated surfaces)
- Background Tertiary: `#1F1F1F` (cards, inputs)
- Text Primary: `#FAFAFA` (pure white)
- Text Secondary: `#A1A1A1` (muted)
- Accent: `#3B82F6` (blue for actions)
- Accent Hover: `#2563EB`
- Border: `#262626`
- Success: `#22C55E`
- Error: `#EF4444`

**Typography:**
- Font Family: `"JetBrains Mono", "Fira Code", monospace`
- Font Sizes:
  - Logo: 24px, weight 700
  - Heading: 18px, weight 600
  - Body: 14px, weight 400
  - Code: 13px, weight 400
  - Small: 12px, weight 400

**Spacing System:**
- Base unit: 4px
- Container padding: 16px (mobile), 24px (desktop)
- Message gap: 12px
- Section gap: 24px

**Visual Effects:**
- Box shadows: `0 4px 24px rgba(0,0,0,0.4)` for elevated elements
- Border radius: 8px (cards), 6px (inputs), 4px (buttons)
- Transitions: 200ms ease-out for all interactions

### Components

**Message Bubble:**
- User: Right-aligned, accent background
- AI: Left-aligned, secondary background
- States: default, typing (pulse animation)

**Input Area:**
- Textarea with auto-resize, max height 150px
- Send button with loading state
- Keyboard shortcut: Cmd/Ctrl + Enter

**Auth Screen:**
- 7-digit code display with large monospace font
- Confirm button with hover state
- Link status indicator

**Sync Status Indicator:**
- Dot indicator (green: synced, yellow: syncing, red: disconnected)
- Animated pulse when syncing

## Functionality Specification

### Core Features

**1. Chat System**
- Send and receive messages
- Markdown rendering (bold, italic, lists, links)
- LaTeX rendering via KaTeX
- Code syntax highlighting with copy button
- Streaming responses with typing indicator
- Auto-scroll to bottom on new messages

**2. Tools**
- `save_memory({ fact })`: Save user preferences to Firestore
- `render_ui({ html })`: Render custom HTML in chat
- Auto-detect [END_CONVERSATION] to lock chat

**3. Cross-Platform Sync**
- CLI generates 7-digit code (e.g., CIPH-A1B2)
- CLI polls endpoint every 2 seconds
- Web app verifies via URL parameter
- Firestore stores verification status
- On success, CLI receives auth token and API key

### User Interactions

**Authentication Flow:**
1. CLI user requests login → generates code
2. User visits web app with code
3. User signs in with Google
4. Web app confirms link
5. CLI receives credentials

**Chat Flow:**
1. User types message
2. Press Enter or click Send
3. Message appears in chat
4. AI responds with streaming
5. Tools execute if needed

### Data Handling

**Firestore Collections:**
- `users/{uid}`: User data and memory
- `auth_requests/{code}`: CLI verification requests

**Schema:**
```typescript
// users/{uid}
{
  uid: string,
  email: string,
  displayName: string,
  photoURL: string,
  memory: { [key: string]: any },
  createdAt: Timestamp,
  updatedAt: Timestamp
}

// auth_requests/{code}
{
  code: string,
  status: 'pending' | 'verified' | 'expired',
  uid: string | null,
  apiKey: string | null,
  createdAt: Timestamp,
  expiresAt: Timestamp
}
```

### Edge Cases
- Network offline: Show disconnect indicator
- Token expired: Redirect to login
- Invalid code: Show error message
- Rate limiting: Queue messages

## Technical Specification

### File Structure
```
/cipher
├── src/
│   ├── components/
│   │   ├── ChatMessage.tsx
│   │   ├── ChatInput.tsx
│   │   ├── AuthScreen.tsx
│   │   ├── SyncStatus.tsx
│   │   └── CodeBlock.tsx
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useChat.ts
│   │   └── useSync.ts
│   ├── lib/
│   │   ├── firebase.ts
│   │   └── opencode.ts
│   ├── types/
│   │   └── index.ts
│   ├── App.tsx
│   ├── Auth.tsx
│   ├── index.css
│   └── main.tsx
├── api/
│   ├── auth/
│   │   └── verify.ts
│   └── chat.ts
├── server.ts
├── vercel.json
├── firebase-applet-config.json
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
└── index.html
```

### API Endpoints

**POST /api/auth/verify**
- Create new verification code
- Returns: `{ code, expiresAt }`

**GET /api/auth/verify?code=CIPH-A1B2**
- Poll for verification status
- Returns: `{ status, uid, apiKey }` when verified

**POST /api/chat**
- Send message to AI
- Body: `{ message, history }`
- Returns: Stream response with tool calls

### Security Rules
```javascript
match /users/{uid} {
  allow read, write: if request.auth != null && request.auth.uid == uid;
}
match /auth_requests/{code} {
  allow get, create, update: if request.auth != null;
}
```

## Acceptance Criteria

1. **Chat works**: User can send messages and receive AI responses with Markdown/LaTeX/code
2. **Auth works**: CLI can generate code, web can verify, sync completes
3. **Memory works**: save_memory() persists data to Firestore
4. **UI is minimalist**: Pure black background, white text, brutalist grids
5. **Responsive**: Works on mobile and desktop
6. **API proxy works**: OpenCode API key is hidden behind serverless function