import type { ReactNode } from "react";

export type TableView = {
  columns: string[];
  rows: ReactNode[][];
};

export type SortState = { column: number; direction: "asc" | "desc" };

/**
 * A plain table. Optional: clickable rows, and sortable column headers
 * (sorting itself is the caller's job; this only reports clicks).
 */
export function DataTable({
  columns,
  rows,
  height = "capped",
  onRowClick,
  sortable,
  sort,
  onSort,
}: TableView & {
  /** "capped" scrolls inside a card; "full" grows with the page. */
  height?: "capped" | "full";
  onRowClick?: (index: number) => void;
  sortable?: number[];
  sort?: SortState;
  onSort?: (column: number) => void;
}) {
  return (
    <div className={height === "capped" ? "table-wrap" : undefined}>
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((c, i) => {
              const canSort = !!onSort && (sortable ?? []).includes(i);
              const active = sort?.column === i;
              return (
                <th
                  key={c}
                  aria-sort={active ? (sort.direction === "asc" ? "ascending" : "descending") : undefined}
                >
                  {canSort ? (
                    <button className="sort-button" onClick={() => onSort(i)}>
                      {c}
                      {active ? (sort.direction === "asc" ? " ▲" : " ▼") : ""}
                    </button>
                  ) : (
                    c
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={i}
              className={onRowClick ? "clickable" : undefined}
              onClick={onRowClick ? () => onRowClick(i) : undefined}
            >
              {row.map((cell, j) => (
                <td key={j}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
