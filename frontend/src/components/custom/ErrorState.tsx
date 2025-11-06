import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';

interface ErrorStateProps {
  title?: string;
  message: string;
  retry?: () => void;
  className?: string;
}

export function ErrorState({
  title = 'Algo salió mal',
  message,
  retry,
  className,
}: ErrorStateProps) {
  return (
    <div className={cn('flex items-center justify-center p-8', className)}>
      <Card className="max-w-lg border-error-red-200 dark:border-error-red-900 animate-in fade-in zoom-in-95 duration-300">
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <AlertCircle className="h-5 w-5 text-error-red-600 dark:text-error-red-400 flex-shrink-0" />
            <div className="space-y-2 flex-1">
              <h3 className="font-semibold text-error-red-900 dark:text-error-red-100">{title}</h3>
              <p className="text-sm text-muted-foreground">{message}</p>
              {retry && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={retry}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Reintentar
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

