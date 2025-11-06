import type { ReactNode } from 'react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Filter, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

interface FilterPanelProps {
  children: ReactNode;
  onReset?: () => void;
  onApply?: () => void;
  activeFilters?: number;
  title?: string;
  description?: string;
  className?: string;
}

export function FilterPanel({
  children,
  onReset,
  onApply,
  activeFilters = 0,
  title = 'Filtros',
  description = 'Aplica filtros para refinar los resultados',
  className,
}: FilterPanelProps) {
  const [open, setOpen] = useState(false);

  const handleApply = () => {
    onApply?.();
    setOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className="relative">
          <Filter className="mr-2 h-4 w-4" />
          Filtros
          {activeFilters > 0 && (
            <span className="ml-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
              {activeFilters}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>{description}</SheetDescription>
        </SheetHeader>
        <div className={cn('mt-6 space-y-4', className)}>
          {children}
        </div>
        <div className="mt-6 flex gap-2">
          {onReset && (
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                onReset();
                setOpen(false);
              }}
            >
              <X className="mr-2 h-4 w-4" />
              Limpiar
            </Button>
          )}
          {onApply && (
            <Button className="flex-1" onClick={handleApply}>
              Aplicar Filtros
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

