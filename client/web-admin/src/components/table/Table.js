import { useMemo, useState } from 'react';
import {
    IconButton, Paper, Table, TableBody, TableCell, TableContainer, TableHead,
    TablePagination, TableRow, TextField, Tooltip, Typography,
} from '@mui/material';
import Skeleton from '../../utils/Skeleton';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import TableChartIcon from '@mui/icons-material/TableChart';
import InboxIcon from '@mui/icons-material/Inbox';
import { buildCsvData, buildSheetData, filterRows, formatCellValue, normalizeColumns, paginateRows, sortRows } from './tableUtils';

function DataTable({ data = [], columns = [], config = {} }) {
    const rowsPerPageOptions = [5, 10, 25];
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(rowsPerPageOptions[0]);
    const [searchText, setSearchText] = useState('');
    const [sortConfig, setSortConfig] = useState(null);

    const enableSearch = config.search ?? false;
    const enablePagination = config.pagination ?? true;
    const enableSorting = config.sorting ?? true;
    const enableSelection = config.selection ?? false;

    const onRowClick = config.onRowClick;
    const onCellClick = config.onCellClick;
    const onSortChange = config.onSortChange;
    const onFilterChange = config.onFilterChange;
    const onPageChange = config.onPageChange;
    const enableExportCsv = config.exportCsv ?? false;
    const enableExportExcel = config.exportExcel ?? false;
    const loading = config.loading ?? false;
    const emptyMessage = config.emptyMessage || 'No data available';
    const theme = config.theme || 'light';
    const headerStyle = config.headerStyle || {};
    const rowStyle = config.rowStyle || {};
    const cellStyle = config.cellStyle || {};
    const borderStyle = config.borderStyle || {};
    const tableColumns = useMemo(() => normalizeColumns(columns, data), [columns, data]);

    const filteredRows = useMemo(() => filterRows(data, searchText, tableColumns), [data, searchText, tableColumns]);
    const sortedRows = useMemo(() => sortRows(filteredRows, sortConfig), [filteredRows, sortConfig]);
    const pagedRows = useMemo(() => paginateRows(sortedRows, page, enablePagination ? rowsPerPage : sortedRows.length), [page, rowsPerPage, sortedRows, enablePagination]);

    const handleChangePage = (_, newPage) => {
        setPage(newPage);
        if (typeof onPageChange === 'function') onPageChange({ page: newPage, rowsPerPage });
    };

    const handleChangeRowsPerPage = (event) => {
        const newSize = parseInt(event.target.value, 10);
        setRowsPerPage(newSize);
        setPage(0);
        if (typeof onPageChange === 'function') onPageChange({ page: 0, rowsPerPage: newSize });
    };

    const handleSort = (field) => {
        if (!enableSorting) return;
        setSortConfig((current) => {
            let next;
            if (current?.field === field) {
                next = current.direction === 'asc' ? { field, direction: 'desc' } : null;
            } else {
                next = { field, direction: 'asc' };
            }
            if (typeof onSortChange === 'function') onSortChange(next);
            return next;
        });
        setPage(0);
    };

    const handleExportCsv = () => {
        if (!enableExportCsv) return;
        const blob = new Blob([buildCsvData(sortedRows, tableColumns)], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${config.exportFileName || 'table-data'}.csv`;
        link.click();
        URL.revokeObjectURL(url);
    };

    const handleExportExcel = async () => {
        if (!enableExportExcel) return;

        // pages can still take over with their own handler
        if (typeof config.onExportExcel === 'function') {
            return config.onExportExcel(sortedRows, tableColumns);
        }

        // xlsx is loaded on demand to keep it out of the main bundle
        const XLSX = await import('xlsx');

        const worksheet = XLSX.utils.aoa_to_sheet(buildSheetData(sortedRows, tableColumns));
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
        XLSX.writeFile(workbook, `${config.exportFileName || 'table-data'}.xlsx`);
    };

    if (loading) {
        return (
            <Skeleton variant="table" rows={rowsPerPage} columns={tableColumns.length || 4} />
        );
    }

    return (
        <Paper variant="outlined"
            className="overflow-hidden rounded-2xl border border-[var(--card-border)] bg-[var(--table-row-bg)] shadow-[var(--shadow-sm)]">

            {(enableSearch || enableExportCsv || enableExportExcel) && (

                <div className="flex flex-wrap items-center justify-between gap-3 border-b 
                    border-[var(--table-toolbar-border)] bg-[var(--table-toolbar-bg)] px-4 py-3">

                    {enableSearch && (

                        <TextField size="small" placeholder="Search..." value={searchText}
                            onChange={(event) => {
                                const value = event.target.value;
                                setSearchText(value);
                                setPage(0);
                                onFilterChange?.(value);
                            }}

                            className="flex-1 !min-w-[15rem] !max-w-[20rem]"

                            sx={{
                                "& .MuiOutlinedInput-root": {
                                    backgroundColor: "var(--table-search-bg)",
                                    color: "var(--table-search-text)",

                                    "& fieldset": {
                                        borderColor: "var(--table-search-border)"
                                    },

                                    "&:hover fieldset": {
                                        borderColor: "var(--brand-primary)"
                                    },

                                    "&.Mui-focused fieldset": {
                                        borderColor: "var(--brand-primary)"
                                    }
                                },

                                "& input::placeholder": {
                                    color: "var(--table-search-placeholder)",
                                    opacity: 1
                                }
                            }}
                        />

                    )}

                    <div className="flex items-center gap-2">

                        {enableExportCsv && (

                            <Tooltip title="Export CSV">

                                <IconButton
                                    onClick={handleExportCsv}
                                    className="!rounded-lg !border !border-[var(--card-border)] !bg-[var(--table-row-bg)]
                                !text-[var(--text-primary)] hover:!bg-[var(--hover-bg)]">

                                    <FileDownloadIcon fontSize="small" />

                                </IconButton>

                            </Tooltip>

                        )}

                        {enableExportExcel && (

                            <Tooltip title="Export Excel">

                                <IconButton
                                    onClick={handleExportExcel}
                                    className="!rounded-lg !border !border-[var(--card-border)] !bg-[var(--table-row-bg)]
                                !text-[var(--text-primary)] hover:!bg-[var(--hover-bg)]
                            "
                                >

                                    <TableChartIcon fontSize="small" />

                                </IconButton>

                            </Tooltip>

                        )}

                    </div>

                </div>

            )}
            <TableContainer className="bg-[var(--table-row-bg)]">

                <Table size="small">

                    <TableHead>

                        <TableRow>

                            {tableColumns.map(column => (

                                <TableCell

                                    key={column.field}

                                    onClick={() => handleSort(column.field)}

                                    className="!border-b !border-[var(--table-header-border)] !bg-[var(--table-header-bg)] !px-4
                                    !py-3 !font-semibold !text-[var(--table-header-text)] !whitespace-nowrap"
                                    sx={{
                                        cursor: enableSorting && column.sortable ? "pointer" : "default",
                                        minWidth: column.minWidth || "5rem"
                                    }}

                                >

                                    {column.headerName}

                                    {enableSorting &&
                                        column.sortable &&
                                        sortConfig?.field === column.field &&
                                        (sortConfig.direction === "asc" ? " ↑" : " ↓")}
                                </TableCell>

                            ))}

                        </TableRow>

                    </TableHead>

                    <TableBody>

                        {pagedRows.length === 0 && (

                            <TableRow>

                                <TableCell colSpan={tableColumns.length || 1}
                                    className="!border-b !border-[var(--table-header-border)] !bg-[var(--table-row-bg)]">

                                    <div className="flex flex-col items-center justify-center gap-2 py-10 text-[var(--text-secondary)]">

                                        <InboxIcon fontSize="medium" />

                                        <Typography variant="body2">
                                            {emptyMessage}
                                        </Typography>

                                    </div>

                                </TableCell>

                            </TableRow>

                        )}

                        {pagedRows.map((row, rowIndex) => (

                            <TableRow hover key={rowIndex} onClick={() => onRowClick?.(row, rowIndex)}

                                className="cursor-pointer bg-[var(--table-row-bg)] transition-colors duration-200 hover:bg-[var(--table-row-hover)]">

                                {tableColumns.map(column => (

                                    <TableCell

                                        key={`${rowIndex}-${column.field}`}

                                        className="!border-b !border-[var(--table-header-border)] !bg-[var(--table-header-bg)] !px-4 !py-3
                                        !text-[var(--table-header-text)]"
                                        sx={{
                                            textAlign: column.align || "left",
                                            minWidth: column.minWidth
                                        }}

                                        onClick={(e) => {

                                            e.stopPropagation();

                                            onCellClick?.(row[column.field], row, column);

                                        }}

                                    >

                                        {column.renderCell
                                            ? column.renderCell(row[column.field], row, column) : formatCellValue(row[column.field], column)}
                                    </TableCell>

                                ))}

                            </TableRow>

                        ))}

                    </TableBody>

                </Table>

            </TableContainer>
            <TablePagination component="div" count={filteredRows.length} page={page} rowsPerPage={rowsPerPage}
                onPageChange={handleChangePage} onRowsPerPageChange={handleChangeRowsPerPage} rowsPerPageOptions={rowsPerPageOptions}
                className=" border-t border-[var(--table-toolbar-border)] bg-[var(--table-pagination-bg)] !text-[var(--table-pagination-text)]"
                sx={{
                    "& .MuiSelect-icon": {
                        color: "var(--table-pagination-text)",
                    }
                }} />
        </Paper>
    );
}

export default DataTable;