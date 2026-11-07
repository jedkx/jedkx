import { readFile, writeFile, rename } from 'node:fs/promises';
const profile = JSON.parse(await readFile(new URL('../data/profile.json', import.meta.url), 'utf8'));
const headers = { 'User-Agent': 'jedkx-profile', Accept: 'application/vnd.github+json' };
if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
const repos = [];
for (let page = 1; page <= 10; page++) {
  const response = await fetch(`https://api.github.com/users/${profile.username}/repos?per_page=100&sort=updated&page=${page}`, { headers, signal: AbortSignal.timeout(15000) });
  if (!response.ok) throw new Error(`GitHub repositories: HTTP ${response.status}`);
  const batch = await response.json();
  if (!Array.isArray(batch)) throw new Error('Invalid repository response');
  for (const repo of batch) {
    if (!repo || typeof repo.name !== 'string' || typeof repo.html_url !== 'string' || !repo.html_url.startsWith('https://github.com/')) throw new Error('Invalid repository record');
    const { name, description, language, html_url, pushed_at, stargazers_count, fork, archived } = repo;
    repos.push({ name, description, language, html_url, pushed_at, stargazers_count, fork, archived });
  }
  if (batch.length < 100) break;
}
if (!repos.length) throw new Error('Refusing to replace repository data with an empty response');
const target = new URL('../data/repositories.json', import.meta.url);
await writeFile(new URL('../data/repositories.next.json', import.meta.url), JSON.stringify(repos, null, 2) + '\n');
await rename(new URL('../data/repositories.next.json', import.meta.url), target);
console.log(`Saved ${repos.length} public repositories`);
