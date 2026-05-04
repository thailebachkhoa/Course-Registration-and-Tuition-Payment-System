const { spawnSync } = require('node:child_process');

function run(command, args) {
  const result = spawnSync(command, args, {
    encoding: 'utf8',
  });

  return {
    ok: result.status === 0,
    stdout: (result.stdout || '').trim(),
    stderr: (result.stderr || '').trim(),
    error: result.error,
  };
}

function printResult(title, result, successHint) {
  if (result.ok) {
    console.log(`[OK] ${title}`);
    if (result.stdout) {
      console.log(result.stdout);
    } else if (successHint) {
      console.log(successHint);
    }
    return;
  }

  console.log(`[FAIL] ${title}`);
  if (result.stderr) {
    console.log(result.stderr);
  } else if (result.error) {
    console.log(result.error.message);
  }
}

function main() {
  console.log('MongoDB comparison preflight');
  console.log('Checking Docker prerequisites for Windows host demo...\n');

  const dockerVersion = run('docker', ['--version']);
  printResult('Docker CLI is available', dockerVersion);

  const dockerComposeVersion = run('docker', ['compose', 'version']);
  printResult('Docker Compose is available', dockerComposeVersion);

  if (!dockerVersion.ok || !dockerComposeVersion.ok) {
    console.log('\nRequired setup:');
    console.log('- Install Docker Desktop for Windows');
    console.log('- Start Docker Desktop and wait until Engine is running');
    console.log('- Open a new PowerShell window and rerun `npm run preflight`');
    process.exit(1);
  }

  console.log('\nPreflight passed.');
  console.log('Next steps:');
  console.log('- `npm run docker:up`');
  console.log('- `npm run seed`');
  console.log('- `npm run demo:all`');
}

main();
