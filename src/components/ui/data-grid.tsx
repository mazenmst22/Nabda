"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Icon } from "@/components/ui/icon";

export type DataGridColumn<T> = {
  key: string;
  header: string;
  cell: (row: T) => ReactNode;
  sortValue?: (row: T) => string | number;
};

type SortState = { key: string; direction: "ascending" | "descending" } | null;

export function DataGrid<T>({
  caption,
  columns,
  rows,
  rowKey,
}: {
  caption: string;
  columns: DataGridColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string;
}) {
  const [sort, setSort] = useState<SortState>(null);
  const sortedRows = useMemo(() => {
    if (!sort) return rows;
    const column = columns.find((entry) => entry.key === sort.key);
    if (!column?.sortValue) return rows;
    return [...rows].sort((first, second) => {
      const firstValue = column.sortValue?.(first) ?? "";
      const secondValue = column.sortValue?.(second) ?? "";
      const result =
        typeof firstValue === "number" && typeof secondValue === "number"
          ? firstValue - secondValue
          : String(firstValue).localeCompare(String(secondValue));
      return sort.direction === "ascending" ? result : -result;
    });
  }, [columns, rows, sort]);

  function toggleSort(key: string) {
    setSort((current) =>
      current?.key === key && current.direction === "ascending"
        ? { key, direction: "descending" }
        : { key, direction: "ascending" },
    );
  }

  return (
    <div className="ui-data-grid" tabIndex={0}>
      <table>
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                aria-sort={sort?.key === column.key ? sort.direction : undefined}
              >
                {column.sortValue ? (
                  <button type="button" onClick={() => toggleSort(column.key)}>
                    <span>{column.header}</span>
                    <Icon name="sort" size={16} />
                  </button>
                ) : (
                  column.header
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedRows.map((row) => (
            <tr key={rowKey(row)}>
              {columns.map((column) => (
                <td key={column.key}>{column.cell(row)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
