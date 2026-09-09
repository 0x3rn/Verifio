import { getBalance, getCountries, getServices } from '../lib/smspool.ts';

async function main() {
  const [balance, services, countries] = await Promise.all([
    getBalance(),
    getServices(),
    getCountries(),
  ]);

  const result = {
    ok: balance.success && services.length > 0 && countries.length > 0,
    balanceRequestAccepted: balance.success,
    servicesReturned: services.length,
    countriesReturned: countries.length,
  };

  console.log(JSON.stringify(result));

  if (!result.ok) process.exitCode = 1;
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : 'SMSPool connectivity check failed.');
  process.exitCode = 1;
});
