import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { EmptyState } from "./EmptyState";
import { Loader } from "./Loader";
import { toTitleCase } from "../utils/format";

export function DataTable({
  columns,
  rows,
  rowKey = "id",
  loading = false,
  emptyTitle = "Nothing to show yet",
  emptyDescription,
  renderActions,
  page = 1,
  pageSize = 8,
  total = 0,
  onPageChange,
}) {
  const source = Array.isArray(rows) ? rows : [];
  const safePage = Math.max(page, 1);
  const safePageSize = Math.max(pageSize, 1);
  const totalItems = total || source.length;
  const totalPages = Math.max(Math.ceil(totalItems / safePageSize), 1);

  if (loading) {
    return <Loader label="Loading records" />;
  }

  if (!source.length) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <div className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-soft">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-100">
          <thead className="bg-slate-50">
            <tr>
              {columns.map((column) => (
                <th key={column.key} className="whitespace-nowrap px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  {column.header || toTitleCase(column.key)}
                </th>
              ))}
              {renderActions ? (
                <th className="whitespace-nowrap px-5 py-4 text-right text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Actions
                </th>
              ) : null}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {source.map((row) => (
              <tr key={row[rowKey] ?? JSON.stringify(row)} className="transition hover:bg-slate-50/80">
                {columns.map((column) => (
                  <td key={column.key} className="max-w-[18rem] px-5 py-4 align-top text-sm text-slate-700">
                    {column.render ? column.render(row) : String(row[column.key] ?? "—")}
                  </td>
                ))}
                {renderActions ? <td className="px-5 py-4 text-right">{renderActions(row)}</td> : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {onPageChange ? (
        <div className="flex items-center justify-between gap-3 border-t border-slate-100 px-5 py-4">
          <p className="text-sm text-slate-500">
            Page {safePage} of {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onPageChange(Math.max(1, safePage - 1))}
              disabled={safePage <= 1}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <FiChevronLeft />
              Prev
            </button>
            <button
              type="button"
              onClick={() => onPageChange(Math.min(totalPages, safePage + 1))}
              disabled={safePage >= totalPages}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
              <FiChevronRight />
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
