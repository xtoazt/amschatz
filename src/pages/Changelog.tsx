import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, GitCommit, Loader2, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

interface Commit {
  sha: string;
  commit: {
    message: string;
    author: {
      name: string;
      date: string;
    };
  };
  html_url: string;
}

interface GroupedCommits {
  date: string;
  commits: Commit[];
}

const REPO = 'hypnotized1337/Anonymous-Chat';

export default function Changelog() {
  const [commits, setCommits] = useState<GroupedCommits[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`https://api.github.com/repos/${REPO}/commits?per_page=100`)
      .then(res => {
        if (!res.ok) throw new Error(`GitHub API returned ${res.status}`);
        return res.json();
      })
      .then((data: Commit[]) => {
        const grouped: Record<string, Commit[]> = {};
        data.forEach(c => {
          const date = new Date(c.commit.author.date).toLocaleDateString('en-US', {
            year: 'numeric', month: 'short', day: 'numeric',
          });
          (grouped[date] ||= []).push(c);
        });
        setCommits(Object.entries(grouped).map(([date, commits]) => ({ date, commits })));
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground p-4 sm:p-8 font-mono">
      <div className="max-w-xl mx-auto">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="w-3 h-3" /> back
        </Link>

        <h1 className="text-sm font-medium mb-6 tracking-tight">changelog</h1>

        {loading && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="w-3 h-3 animate-spin" /> fetching commits…
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 text-xs text-destructive">
            <AlertCircle className="w-3 h-3" /> {error}
          </div>
        )}

        {!loading && !error && commits.map((group, gi) => (
          <motion.div
            key={group.date}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: gi * 0.05 }}
            className="mb-5"
          >
            <p className="text-[10px] text-muted-foreground mb-1.5">{group.date}</p>
            <div className="space-y-1">
              {group.commits.map(c => (
                <a
                  key={c.sha}
                  href={c.html_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-2 group text-xs hover:bg-muted/50 rounded px-1.5 py-1 -mx-1.5 transition-colors"
                >
                  <GitCommit className="w-3 h-3 mt-0.5 text-muted-foreground shrink-0" />
                  <span className="text-muted-foreground font-medium shrink-0">{c.sha.slice(0, 7)}</span>
                  <span className="text-foreground/80 group-hover:text-foreground transition-colors truncate">
                    {c.commit.message.split('\n')[0]}
                  </span>
                </a>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
