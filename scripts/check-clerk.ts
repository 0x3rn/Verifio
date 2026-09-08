import { createClerkClient } from '@clerk/backend';

async function main() {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim();
  const secretKey = process.env.CLERK_SECRET_KEY?.trim();
  if (!publishableKey || !secretKey) {
    throw new Error('NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY and CLERK_SECRET_KEY are required.');
  }

  const clerk = createClerkClient({ secretKey });
  await clerk.users.getUserList({ limit: 1 });
  console.log('Clerk API connected and credentials accepted.');
}

main().catch((error) => {
  console.error('Clerk check failed:', error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
