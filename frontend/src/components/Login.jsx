import { useState } from 'react';

export default function Login({ onLogin }) {
  const [name, setName] = useState('');
  const [touched, setTouched] = useState(false);

  const trimmed = name.trim();
  const isValid = trimmed.length >= 2 && trimmed.length <= 20;

  function handleSubmit(e) {
    e.preventDefault();
    setTouched(true);
    if (isValid) onLogin(trimmed);
  }

  return (
    <div className="login-screen">
      <form className="login-card" onSubmit={handleSubmit}>
        <h1>Chat</h1>
        <p className="login-subtitle">Pick a username to join the conversation</p>
        <input
          autoFocus
          type="text"
          placeholder="e.g. alice"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={20}
        />
        {touched && !isValid && (
          <p className="login-error">Username must be 2-20 characters.</p>
        )}
        <button type="submit" disabled={!isValid}>
          Join chat
        </button>
      </form>
    </div>
  );
}
