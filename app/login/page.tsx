import Link from 'next/link';
import { SignIn } from '@clerk/nextjs';

export default function LoginPage() {
  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <h1 className="auth-header__title">Welcome Back</h1>
          <p className="auth-header__subtitle">Sign in with your username and password, or continue with Google.</p>
        </div>
        <div className="auth-form-card clerk-auth-shell">
          <SignIn signUpUrl="/register" fallbackRedirectUrl="/dashboard" />
          <p className="auth-footer__text clerk-auth-back"><Link href="/">← Back to Home</Link></p>
        </div>
      </div>
    </div>
  );
}
