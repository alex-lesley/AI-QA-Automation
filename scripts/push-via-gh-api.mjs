import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

function ghApi(endpoint, method = 'GET', fields = {}) {
  const args = ['api', endpoint, '-X', method];
  for (const [key, value] of Object.entries(fields)) {
    args.push('-f', `${key}=${value}`);
  }
  return JSON.parse(execFileSync('gh', args, { encoding: 'utf8' }));
}

const payload = JSON.parse(readFileSync(new URL('../mcp-args.json', import.meta.url), 'utf8'));
const { owner, repo, branch, message, files } = payload;

const ref = ghApi(`repos/${owner}/${repo}/git/ref/heads/${branch}`);
const baseSha = ref.object.sha;
const baseCommit = ghApi(`repos/${owner}/${repo}/git/commits/${baseSha}`);
const baseTreeSha = baseCommit.tree.sha;

const treeEntries = files.map((file) => {
  const blob = ghApi(`repos/${owner}/${repo}/git/blobs`, 'POST', {
    content: Buffer.from(file.content, 'utf8').toString('base64'),
    encoding: 'base64',
  });
  return { path: file.path, mode: '100644', type: 'blob', sha: blob.sha };
});

const tree = ghApi(`repos/${owner}/${repo}/git/trees`, 'POST', {
  base_tree: baseTreeSha,
  tree: JSON.stringify(treeEntries),
});

const commit = ghApi(`repos/${owner}/${repo}/git/commits`, 'POST', {
  message,
  tree: tree.sha,
  parents: baseSha,
});

ghApi(`repos/${owner}/${repo}/git/refs/heads/${branch}`, 'PATCH', {
  sha: commit.sha,
  force: 'false',
});

console.log(`Pushed ${commit.sha} to ${owner}/${repo}@${branch}`);
