import Link from 'next/link';
import { SignIn } from '@clerk/nextjs';
import { AuthFormLoading } from '@/components/AuthFormLoading';
import { ArrowLeftIcon } from '@/components/Icons';

export default function LoginPage() {
  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <h1 className="auth-header__title">Welcome Back</h1>
          <p className="auth-header__subtitle">Sign in with your username and password, or continue with Google.</p>
        </div>
        <div className="auth-form-card clerk-auth-shell">
          <div className="auth-back-link-wrap">
            <Link href="/" className="auth-back-link"><span className="auth-back-link__arrow" aria-hidden="true"><ArrowLeftIcon className="icon-sm" /></span> Back to home</Link>
          </div>
          <SignIn
            path="/login"
            routing="path"
            signUpUrl="/register"
            fallbackRedirectUrl="/dashboard"
            fallback={<AuthFormLoading label="Loading sign-in form" />}
          />
        </div>
      </div>
    </div>
  );
}
