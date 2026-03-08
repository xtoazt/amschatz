import { memo, forwardRef } from 'react';
import { Check, CheckCheck } from 'lucide-react';

interface StatusIconProps {
  status?: string;
}

export const StatusIcon = memo(forwardRef<HTMLSpanElement, StatusIconProps>(function StatusIcon({ status, ...props }, ref) {
  if (status === 'read') return <span ref={ref} {...props}><CheckCheck className="w-3 h-3 text-primary inline-block" /></span>;
  if (status === 'delivered') return <span ref={ref} {...props}><CheckCheck className="w-3 h-3 text-muted-foreground inline-block" /></span>;
  if (status === 'sent') return <span ref={ref} {...props}><Check className="w-3 h-3 text-muted-foreground inline-block" /></span>;
  return null;
}));
