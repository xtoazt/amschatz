import { memo } from 'react';
import { Check, CheckCheck } from 'lucide-react';

interface StatusIconProps {
  status?: string;
}

export const StatusIcon = memo(function StatusIcon({ status }: StatusIconProps) {
  if (status === 'read') return <CheckCheck className="w-3 h-3 text-primary inline-block" />;
  if (status === 'delivered') return <CheckCheck className="w-3 h-3 text-muted-foreground inline-block" />;
  if (status === 'sent') return <Check className="w-3 h-3 text-muted-foreground inline-block" />;
  return null;
});
