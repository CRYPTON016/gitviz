'use client';

import { useState } from 'react';
import { GitBranch, Search, RefreshCw, ExternalLink } from 'lucide-react';
import BranchGraph from '@/components/BranchGraph';

interface Branch {
  name: string;
  sha: string;
  protected: boolean;
}

interface Commit {
  sha: string;
  message: string;
  author: string;
  date: string;
  parents: string[];
}

export default function Home() {
  const [repoUrl, setRepoUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [commits, setCommits] = useState<Commit[]>([]);
  const [repoName, setRepoName] = useState<string | null>(null);

  const parseRepoUrl = (url: string): { owner: string; repo: string } | null => {
    const patterns = [
      /github\.com\/([^\/]+)\/([^\/]+)/,
      /^([^\/]+)\/([^\/]+)$/
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        return { owner: match[1], repo: match[2].replace('.git', '') };
      }
    }
    return null;
  };

  const fetchRepoData = async () => {
    const parsed = parseRepoUrl(repoUrl);
    if (!parsed) {
      setError('Invalid repository URL. Use format: owner/repo or https://github.com/owner/repo');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const branchesRes = await fetch(
        `https://api.github.com/repos/${parsed.owner}/${parsed.repo}/branches`
      );

      if (!branchesRes.ok) {
        throw new Error('Failed to fetch branches. Check if repository exists and is public.');
      }

      const branchesData = await branchesRes.json();
      setBranches(branchesData.map((b: { name: string; commit: { sha: string }; protected: boolean }) => ({
        name: b.name,
        sha: b.commit.sha,
        protected: b.protected
      })));

      const commitsRes = await fetch(
        `https://api.github.com/repos/${parsed.owner}/${parsed.repo}/commits?per_page=50`
      );

      if (commitsRes.ok) {
        const commitsData = await commitsRes.json();
        setCommits(commitsData.map((c: { sha: string; commit: { message: string; author: { name: string; date: string } }; parents: { sha: string }[] }) => ({
          sha: c.sha,
          message: c.commit.message.split('\n')[0],
          author: c.commit.author.name,
          date: c.commit.author.date,
          parents: c.parents.map((p: { sha: string }) => p.sha)
        })));
      }

      setRepoName(`${parsed.owner}/${parsed.repo}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-6 md:p-8">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <GitBranch className="w-8 h-8 text-[var(--terminal-prompt)]" />
            <h1 className="text-3xl font-bold text-[var(--terminal-prompt)]">
              GitViz
            </h1>
          </div>
          <p className="text-[var(--terminal-text)] opacity-80">
            Interactive GitHub repository branch visualization
          </p>
        </header>

        <div className="bg-[var(--terminal-bg)] border border-[var(--terminal-border)] rounded-lg p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label htmlFor="repo-url" className="block text-sm text-[var(--terminal-text)] mb-2">
                Repository URL or owner/repo
              </label>
              <input
                id="repo-url"
                type="text"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                placeholder="e.g., facebook/react or https://github.com/facebook/react"
                className="w-full px-4 py-2 bg-[var(--background)] border border-[var(--terminal-border)] rounded-lg text-[var(--terminal-text)] placeholder-gray-500 focus:outline-none focus:border-[var(--terminal-prompt)]"
                onKeyDown={(e) => e.key === 'Enter' && fetchRepoData()}
              />
            </div>
            <button
              onClick={fetchRepoData}
              disabled={loading || !repoUrl}
              className="px-6 py-2 bg-[var(--terminal-prompt)] text-black font-medium rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 self-end"
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
              Visualize
            </button>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-900/30 border border-red-700 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}
        </div>

        {repoName && branches.length > 0 && (
          <div className="bg-[var(--terminal-bg)] border border-[var(--terminal-border)] rounded-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-[var(--terminal-text)]">
                {repoName}
              </h2>
              <a
                href={`https://github.com/${repoName}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-[var(--terminal-accent)] hover:opacity-80 transition-opacity"
              >
                <span className="text-sm">View on GitHub</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>

            <div className="mb-6">
              <h3 className="text-sm font-medium text-[var(--terminal-prompt)] mb-3">
                Branches ({branches.length})
              </h3>
              <div className="flex flex-wrap gap-2">
                {branches.map((branch) => (
                  <span
                    key={branch.name}
                    className={`px-3 py-1 text-sm rounded-full ${
                      branch.protected
                        ? 'bg-yellow-900/30 text-yellow-400 border border-yellow-700'
                        : 'bg-[var(--terminal-border)] text-[var(--terminal-text)]'
                    }`}
                  >
                    {branch.name}
                    {branch.protected && ' (protected)'}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-[var(--terminal-prompt)] mb-3">
                Commit Graph
              </h3>
              <BranchGraph commits={commits} branches={branches} />
            </div>
          </div>
        )}

        {!repoName && !loading && (
          <div className="bg-[var(--terminal-bg)] border border-[var(--terminal-border)] rounded-lg p-12 text-center">
            <GitBranch className="w-16 h-16 text-[var(--terminal-border)] mx-auto mb-4" />
            <h2 className="text-xl text-[var(--terminal-text)] mb-2">
              No Repository Selected
            </h2>
            <p className="text-[var(--terminal-text)] opacity-60">
              Enter a GitHub repository URL above to visualize its branch structure
            </p>
          </div>
        )}

        <footer className="mt-8 text-center text-sm text-[var(--terminal-text)] opacity-50">
          <p>GitViz - Part of Cloud Sequrity Tools</p>
          <p className="mt-1">
            <a
              href="https://cloudsequrity.com"
              className="text-[var(--terminal-accent)] hover:opacity-80"
            >
              cloudsequrity.com
            </a>
          </p>
        </footer>
      </div>
    </div>
  );
}
