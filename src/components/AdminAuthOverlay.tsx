import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AdminAuthOverlayProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export function AdminAuthOverlay({ onSuccess, onCancel }: AdminAuthOverlayProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim() || loading) return;

    setLoading(true);
    setError('');

    try {
      const { data, error: fnError } = await supabase.functions.invoke('verify-admin', {
        body: { password: password.trim() },
      });

      if (fnError) throw fnError;

      if (data?.valid) {
        sessionStorage.setItem('is_admin', 'true');
        onSuccess();
      } else {
        setError('ACCESS DENIED');
        setPassword('');
      }
    } catch {
      setError('CONNECTION FAILED');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex items-center justify-center p-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4 font-mono">
        <div className="text-green-500 text-xs space-y-1">
          <p>{'>'} ADMIN AUTHENTICATION REQUIRED</p>
          <p>{'>'} ENTER MASTER KEY TO PROCEED</p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-green-500 text-sm">$</span>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="••••••••"
            autoFocus
            disabled={loading}
            className="flex-1 bg-transparent border-none outline-none text-green-400 text-sm placeholder:text-green-900 caret-green-500"
            maxLength={100}
          />
        </div>

        {error && (
          <p className="text-red-500 text-xs font-mono">{'>'} {error}</p>
        )}

        <div className="flex gap-3 text-xs">
          <button
            type="submit"
            disabled={loading || !password.trim()}
            className="text-green-500 hover:text-green-300 disabled:text-green-900 transition-colors"
          >
            [{loading ? 'VERIFYING...' : 'AUTHENTICATE'}]
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="text-green-700 hover:text-green-500 transition-colors"
          >
            [CANCEL]
          </button>
        </div>

        <div className="h-px bg-green-900/50 mt-4" />
        <p className="text-green-900 text-[10px]">
          Session persists until browser tab closes.
        </p>
      </form>
    </div>
  );
}
