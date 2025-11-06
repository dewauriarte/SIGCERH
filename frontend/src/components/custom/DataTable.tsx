import type { ReactNode } from 'react';
import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { Pagination } from './Pagination';
import { SearchBar } from './SearchBar';
import { EmptyState } from './EmptyState';
import { LoadingSpinner } from './LoadingSpinner';
import { cn } from '@/lib/utils';

export interface Column<T> {
  key: keyof T | string;
  title: string;
  render?: (value: any, row: T) => ReactNode;
  sortable?: boolean;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  emptyMessage?: string;
  pagination?: {
    currentPage: number;
    totalPages: number;
    pageSize: number;
    totalItems: number;
    onPageChange: (page: number) => void;
    onPageSizeChange?: (size: number) => void;
  };
  search?: {
    placeholder?: string;
    onSearch: (value: string) => void;
  };
  actions?: ReactNode;
  rowClassName?: (row: T) => string;
  onRowClick?: (row: T) => void;
  className?: string;
}

type SortDirection = 'asc' | 'desc' | null;

export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  loading = false,
  emptyMessage = 'No hay datos para mostrar',
  pagination,
  search,
  actions,
  rowClassName,
  onRowClick,
  className,
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortDirection(null);
        setSortKey(null);
      } else {
        setSortDirection('asc');
      }
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  const sortedData = [...data].sort((a, b) => {
    if (!sortKey || !sortDirection) return 0;

    const aValue = a[sortKey];
    const bValue = b[sortKey];

    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const getSortIcon = (key: string) => {
    if (sortKey !== key) return <ArrowUpDown className="ml-2 h-4 w-4" />;
    if (sortDirection === 'asc') return <ArrowUp className="ml-2 h-4 w-4" />;
    if (sortDirection === 'desc') return <ArrowDown className="ml-2 h-4 w-4" />;
    return <ArrowUpDown className="ml-2 h-4 w-4" />;
  };

  return (
    <div className={cn('space-y-4', className)}>
      {(search || actions) && (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {search && (
            <SearchBar
              placeholder={search.placeholder}
              onSearch={search.onSearch}
              className="w-full sm:max-w-sm"
            />
          )}
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column, index) => (
                <TableHead key={index} className={column.className}>
                  {column.sortable ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="-ml-3 h-8"
                      onClick={() => handleSort(column.key as string)}
                    >
                      {column.title}
                      {getSortIcon(column.key as string)}
                    </Button>
                  ) : (
                    column.title
                  )}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-64">
                  <LoadingSpinner />
                </TableCell>
              </TableRow>
            ) : sortedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-64">
                  <EmptyState
                    title="No hay datos"
                    description={emptyMessage}
                  />
                </TableCell>
              </TableRow>
            ) : (
              sortedData.map((row, rowIndex) => (
                <TableRow
                  key={rowIndex}
                  className={cn(
                    onRowClick && 'cursor-pointer hover:bg-accent',
                    rowClassName?.(row)
                  )}
                  onClick={() => onRowClick?.(row)}
                >
                  {columns.map((column, colIndex) => (
                    <TableCell key={colIndex} className={column.className}>
                      {column.render
                        ? column.render(row[column.key as string], row)
                        : row[column.key as string]}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {pagination && !loading && sortedData.length > 0 && (
        <Pagination {...pagination} />
      )}
    </div>
  );
}

