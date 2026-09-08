export function AuthFormLoading({ label }: { label: string }) {
  return (
    <div className="clerk-auth-loading" role="status" aria-label={label}>
      <div className="clerk-auth-loading__social" />
      <div className="clerk-auth-loading__divider" />
      <div className="clerk-auth-loading__field clerk-auth-loading__field--short" />
      <div className="clerk-auth-loading__field" />
      <div className="clerk-auth-loading__field clerk-auth-loading__field--short" />
      <div className="clerk-auth-loading__button" />
      <div className="clerk-auth-loading__footer" />
    </div>
  );
}
