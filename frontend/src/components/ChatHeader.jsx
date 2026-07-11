export default function ChatHeader({ username, connectionStatus, onlineUsers }) {
  const statusLabel = {
    connected: 'Online',
    connecting: 'Connecting...',
    disconnected: 'Offline',
  }[connectionStatus];

  return (
    <div className="chat-header">
      <div className="chat-header-left">
        <h2>General</h2>
        <span className={`status-dot ${connectionStatus}`} />
        <span className="status-label">{statusLabel}</span>
      </div>
      <div className="chat-header-right">
        <span className="online-count" title={onlineUsers.join(', ')}>
          {onlineUsers.length} online
        </span>
        <span className="current-user">{username}</span>
      </div>
    </div>
  );
}
