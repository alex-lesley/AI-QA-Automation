import {
  buildApiHeaders,
  ensureNoProgramsViaApi,
  getBaseUrl,
  listProgramsViaApi,
  requireApiToken,
} from './didaxis-programs-api';

async function main(): Promise<void> {
  const dryRun = process.argv.includes('--dry-run');
  const baseUrl = getBaseUrl();
  const headers = buildApiHeaders(requireApiToken());

  const before = await listProgramsViaApi(baseUrl, headers);
  console.log(`Didaxis: ${baseUrl}`);
  console.log(`Programs before: ${before.length}`);

  if (dryRun) {
    if (before.length === 0) {
      console.log('Nothing to delete.');
      return;
    }
    console.log('Dry run — programs that would be deleted:');
    for (const program of before) {
      console.log(`  - ${program.id}: ${program.name}`);
    }
    return;
  }

  if (before.length === 0) {
    console.log('No programs to delete.');
    return;
  }

  const { deletedCount, finalCount } = await ensureNoProgramsViaApi(baseUrl, headers);
  console.log(`Deleted: ${deletedCount}`);
  console.log(`Programs after: ${finalCount}`);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exit(1);
});
