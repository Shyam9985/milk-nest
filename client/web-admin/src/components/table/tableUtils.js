export function normalizeColumns(columns = [], data = []) {
  if (columns.length > 0) {
    return columns.map((column) => ({
      field: column.field || column.accessorKey || column.key || '',
      headerName: column.label || column.header || column.field || column.accessorKey || column.key || 'Column',
      type: column.type || 'string',
      sortable: column.sortable !== false,
      filterable: column.filterable !== false,
      searchable: column.searchable !== false,
      exportable: column.exportable !== false,
      headerStyle: column.headerStyle || {},
      cellStyle: column.cellStyle || {},
      align: column.align || 'left',
      minWidth: column.minWidth,
      renderHeader: column.renderHeader,
      renderCell: column.renderCell,
      valueFormatter: column.valueFormatter,
    }));
  }

  if (!data.length) {
    return [];
  }

  return Object.keys(data[0]).map((key) => ({
    field: key,
    headerName: key.charAt(0).toUpperCase() + key.slice(1),
    type: 'string',
    sortable: true,
    filterable: true,
    searchable: true,
    headerStyle: {},
    cellStyle: {},
    align: 'left',
  }));
}

export function formatCellValue(value, column = {}) {
  if (value === null || value === undefined || value === '') {
    return '-';
  }

  if (typeof column.valueFormatter === 'function') {
    return column.valueFormatter(value, column);
  }

  if (column.type === 'number' && typeof value === 'number') {
    return new Intl.NumberFormat().format(value);
  }

  if (column.type === 'boolean' || typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }

  return value;
}

export function filterRows(rows = [], query = '', columns = []) {
  if (!query.trim()) {
    return rows;
  }

  const searchableColumns = columns.filter((column) => column.searchable !== false);
  const normalizedQuery = query.toLowerCase();

  return rows.filter((row) =>
    searchableColumns.some((column) => {
      const value = row[column.field];
      return String(value ?? '').toLowerCase().includes(normalizedQuery);
    })
  );
}

export function sortRows(rows = [], sortConfig = null) {
  if (!sortConfig?.field) {
    return rows;
  }

  const { field, direction = 'asc' } = sortConfig;

  return [...rows].sort((leftRow, rightRow) => {
    const leftValue = leftRow[field];
    const rightValue = rightRow[field];

    const left = leftValue ?? '';
    const right = rightValue ?? '';

    if (typeof left === 'number' && typeof right === 'number') {
      return direction === 'asc' ? left - right : right - left;
    }

    return direction === 'asc'
      ? String(left).localeCompare(String(right), undefined, { sensitivity: 'base' })
      : String(right).localeCompare(String(left), undefined, { sensitivity: 'base' });
  });
}

export function paginateRows(rows = [], page = 0, rowsPerPage = 10) {
  if (rowsPerPage <= 0) {
    return rows;
  }

  const start = page * rowsPerPage;
  return rows.slice(start, start + rowsPerPage);
}

// builds an array-of-arrays (header row + data rows) for sheet exports
export function buildSheetData(rows = [], allColumns = []) {
  const columns = allColumns.filter((column) => column.exportable !== false);

  return [
    columns.map((column) => column.headerName || column.field),
    ...rows.map((row) =>
      columns.map((column) => formatCellValue(row[column.field], column))
    ),
  ];
}

export function buildCsvData(rows = [], allColumns = []) {
  const columns = allColumns.filter((column) => column.exportable !== false);
  const headerLine = columns.map((column) => column.headerName || column.field).join(',');
  const rowsCsv = rows.map((row) =>
    columns
      .map((column) => {
        const value = formatCellValue(row[column.field], column);
        const normalized = String(value ?? '').replace(/"/g, '""');
        return `"${normalized}"`;
      })
      .join(',')
  );

  return [headerLine, ...rowsCsv].join('\n');
}
