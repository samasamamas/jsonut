
import { useState, type FormEvent } from 'react';

interface LoginFormProps {
  onLogin: (email: string, password: string) => void | Promise<void>;
  isLoggingIn: boolean;
  error: string;
}

export default function LoginForm({
  onLogin,
  isLoggingIn,
  error,
}: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isLoggingIn) return;

    const trimmedEmail = email.trim();

    if (!trimmedEmail || !password) {
      return;
    }

    onLogin(trimmedEmail, password);
  };

  return (
    <div className="login-container">
      <form className="login-card" onSubmit={handleSubmit}>
        <h1>JSONut</h1>
        <p>Login Admin Panel</p>

        <label htmlFor="login-email">Email</label>
        <input
          id="login-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Masukkan email"
          autoComplete="username"
          required
          disabled={isLoggingIn}
        />

        <label htmlFor="login-password">Password</label>
        <input
          id="login-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Masukkan password"
          autoComplete="current-password"
          required
          disabled={isLoggingIn}
        />

        {error && (
          <p className="login-error" role="alert">
            {error}
          </p>
        )}

        <button type="submit" disabled={isLoggingIn}>
          {isLoggingIn ? 'Memeriksa...' : 'Login'}
        </button>
      </form>
    </div>
  );
}
