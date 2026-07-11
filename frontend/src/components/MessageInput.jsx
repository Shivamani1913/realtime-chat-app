import { useState } from 'react';

export default function MessageInput({ onSend, onTyping, disabled }) {
  const [text, setText] = useState('');

  function handleChange(e) {
    setText(e.target.value);
    onTyping();
  }

  function handleSubmit(e) {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setText('');
  }

  return (
    <form className="message-input-bar" onSubmit={handleSubmit}>
      <input
        type="text"
        value={text}
        onChange={handleChange}
        placeholder={disabled ? 'Connecting...' : 'Type a message'}
        maxLength={2000}
        disabled={disabled}
      />
      <button type="submit" disabled={disabled || !text.trim()}>
        Send
      </button>
    </form>
  );
}
