#!/usr/bin/env node
/**
 * afterFileEdit guard: block edits that weaken Playwright tests.
 * Exit 0 = allow, 2 = block (weakened assertion), other non-zero = hook error (failClosed blocks).
 */
import { readFileSync } from 'node:fs';
import { stdin } from 'node:process';

async function readStdin() {
  const chunks = [];
  for await (const chunk of stdin) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString('utf8');
}

/** Count expect( on lines that are not line-commented out. */
function countActiveExpects(content) {
  let count = 0;
  for (const line of content.split(/\r?\n/)) {
    if (line.trimStart().startsWith('//')) {
      continue;
    }
    const withoutInlineComment = line.replace(/\/\/.*$/, '');
    const matches = withoutInlineComment.match(/expect\s*\(/g);
    if (matches) {
      count += matches.length;
    }
  }
  return count;
}

/** True when an active expect( in before is commented out on the same line index in after. */
function hasCommentedOutExpect(before, after) {
  const beforeLines = before.split(/\r?\n/);
  const afterLines = after.split(/\r?\n/);

  for (let i = 0; i < afterLines.length; i += 1) {
    const afterLine = afterLines[i];
    const trimmedAfter = afterLine.trimStart();
    if (!trimmedAfter.startsWith('//') || !/expect\s*\(/.test(afterLine)) {
      continue;
    }

    const beforeLine = beforeLines[i] ?? '';
    if (beforeLine.trimStart().startsWith('//')) {
      continue;
    }
    if (/expect\s*\(/.test(beforeLine)) {
      return true;
    }
  }

  return false;
}

/** Reconstruct pre-edit content by reversing the edit replacements. */
function reconstructBefore(after, edits) {
  let content = after;
  for (let i = edits.length - 1; i >= 0; i -= 1) {
    const { old_string: oldString, new_string: newString } = edits[i] ?? {};
    if (typeof oldString !== 'string' || typeof newString !== 'string') {
      continue;
    }
    const index = content.indexOf(newString);
    if (index === -1) {
      content = content.split(newString).join(oldString);
    } else {
      content =
        content.slice(0, index) + oldString + content.slice(index + newString.length);
    }
  }
  return content;
}

function matchesTestsGlob(filePath) {
  const normalized = filePath.replace(/\\/g, '/');
  return /(?:^|\/)tests\//.test(normalized);
}

async function main() {
  let payload;
  try {
    payload = JSON.parse(await readStdin());
  } catch {
    console.error('block-weakened-test: invalid JSON on stdin');
    process.exit(1);
  }

  const filePath = payload.file_path;
  if (!filePath || !matchesTestsGlob(filePath)) {
    process.exit(0);
  }

  let after;
  try {
    after = readFileSync(filePath, 'utf8');
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`block-weakened-test: cannot read ${filePath}: ${message}`);
    process.exit(1);
  }

  const before = reconstructBefore(after, payload.edits ?? []);
  const beforeCount = countActiveExpects(before);
  const afterCount = countActiveExpects(after);

  if (afterCount < beforeCount) {
    console.error(
      `block-weakened-test: BLOCKED — active expect() count dropped from ${beforeCount} to ${afterCount} in ${filePath}`,
    );
    process.exit(2);
  }

  if (hasCommentedOutExpect(before, after)) {
    console.error(
      `block-weakened-test: BLOCKED — an expect() was commented out in ${filePath}`,
    );
    process.exit(2);
  }

  process.exit(0);
}

main();
