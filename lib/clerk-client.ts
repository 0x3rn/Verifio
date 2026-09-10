export const CLERK_REQUEST_TIMEOUT_MS = 20_000;

export function withClerkTimeout<T>(operation: Promise<T>): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error('CLERK_REQUEST_TIMEOUT')), CLERK_REQUEST_TIMEOUT_MS);
  });

  return Promise.race([operation, timeout]).finally(() => {
    if (timeoutId !== undefined) clearTimeout(timeoutId);
  });
}
