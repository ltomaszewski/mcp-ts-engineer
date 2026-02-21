#!/usr/bin/env node
// Log PR URL and provide review command after PR creation

let data = '';
process.stdin.on('data', chunk => data += chunk);
process.stdin.on('end', () => {
  const input = JSON.parse(data);
  const cmd = input.tool_input?.command || '';

  if (/gh pr create/.test(cmd)) {
    const output = input.tool_output?.output || '';
    const match = output.match(/https:\/\/github.com\/[^/]+\/[^/]+\/pull\/\d+/);

    if (match) {
      console.error('[Hook] PR created: ' + match[0]);
      const repo = match[0].replace(/https:\/\/github.com\/([^/]+\/[^/]+)\/pull\/\d+/, '$1');
      const pr = match[0].replace(/.*\/pull\/(\d+)/, '$1');
      console.error('[Hook] To review: gh pr review ' + pr + ' --repo ' + repo);
    }
  }

  console.log(data);
});
