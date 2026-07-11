import { useState } from 'react';
import Login from './components/Login';
import ChatHeader from './components/ChatHeader';
import MessageList from './components/MessageList';
import MessageInput from './components/MessageInput';
import ErrorBanner from './components/ErrorBanner';
import useChat from './hooks/useChat';
import './App.css';

function ChatRoom({ username }) {
  const {
    messages,
    onlineUsers,
    typingUsers,
    connectionStatus,
    error,
    loadingHistory,
    sendMessage,
    notifyTyping,
  } = useChat(username);

  const [dismissedError, setDismissedError] = useState(false);

  return (
    <div className="chat-screen">
      <ChatHeader username={username} connectionStatus={connectionStatus} onlineUsers={onlineUsers} />
      {!dismissedError && (
        <ErrorBanner message={error} onDismiss={() => setDismissedError(true)} />
      )}
      <MessageList
        messages={messages}
        username={username}
        loading={loadingHistory}
        typingUsers={typingUsers}
      />
      <MessageInput
        onSend={sendMessage}
        onTyping={notifyTyping}
        disabled={connectionStatus !== 'connected'}
      />
    </div>
  );
}

function App() {
  const [username, setUsername] = useState(null);

  if (!username) {
    return <Login onLogin={setUsername} />;
  }

  return <ChatRoom username={username} />;
}

export default App;
