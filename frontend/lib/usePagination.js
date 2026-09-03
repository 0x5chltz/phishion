import { useMemo, useState } from 'react';

const PAGE_SIZE = 8;

export function usePagination(items, pageSize = PAGE_SIZE) {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const safePage = Math.min(page, totalPages);

  const pageItems = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, safePage, pageSize]);

  const pages = useMemo(() => {
    const entries = [
      { text: 'PREV', disabled: safePage === 1, onClick: () => setPage((p) => Math.max(1, p - 1)) },
    ];
    for (let i = 1; i <= totalPages; i += 1) {
      entries.push({ text: i, active: i === safePage, onClick: () => setPage(i) });
    }
    entries.push({ text: 'NEXT', disabled: safePage === totalPages, onClick: () => setPage((p) => Math.min(totalPages, p + 1)) });
    return entries;
  }, [safePage, totalPages]);

  return { pageItems, pages, page: safePage, totalPages, setPage };
}
