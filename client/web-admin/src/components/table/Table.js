import { useMemo, useState } from 'react';
import {
    Box, IconButton, Paper, Table, TableBody, TableCell, TableContainer, TableHead,
    TablePagination, TableRow, TextField, Tooltip, Typography, CircularProgress,
} from '@mui/material';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import TableChartIcon from '@mui/icons-material/TableChart';
import { buildCsvData, filterRows, formatCellValue, normalizeColumns, paginateRows, sortRows } from './tableUtils';

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
        link.download = 'table-data.csv';
        link.click();
        URL.revokeObjectURL(url);
    };

    const handleExportExcel = () => {
        if (!enableExportExcel) return;
        if (typeof config.onExportExcel === 'function') {
            config.onExportExcel(sortedRows, tableColumns);
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
            </Box>
        );
    }

    if (!data.length) {
        return (
            <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
                {emptyMessage}
            </Typography>
        );
    }

    return (
        <Paper
            variant="outlined"
            sx={{
                borderRadius: 3,
                overflow: 'hidden',
                bgcolor: theme === 'dark' ? 'background.paper' : 'background.default',
                borderColor: borderStyle.color || 'divider',
            }}
        >
            {(enableSearch || enableExportCsv || enableExportExcel) && (
                <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                    {enableSearch && (
                        <TextField
                            size="small"
                            placeholder="Search"
                            value={searchText}
                            onChange={(event) => {
                                const v = event.target.value;
                                setSearchText(v);
                                setPage(0);
                                if (typeof onFilterChange === 'function') onFilterChange(v);
                            }}
                            sx={{ flexGrow: 1, minWidth: 200, bgcolor: 'transparent' }}
                            InputProps={{
                                sx: {
                                    backgroundColor: 'var(--surface-primary)',
                                    color: 'var(--text-primary)'
                                }
                            }}
                        />
                    )}

                    <Box sx={{ display: 'flex', gap: 1, ml: enableSearch ? 1 : 0 }}>
                        {enableExportCsv && (
                            <Tooltip title="Export CSV">
                                <IconButton
                                    size="small"
                                    onClick={handleExportCsv}
                                    sx={{
                                        border: '1px solid',
                                        borderColor: 'divider',
                                        color: 'var(--text-primary)',
                                        bgcolor: 'transparent'
                                    }}
                                >
                                    <FileDownloadIcon fontSize="small" />
                                </IconButton>
                            </Tooltip>
                        )}

                        {enableExportExcel && (
                            <Tooltip title="Export Excel">
                                <IconButton
                                    size="small"
                                    onClick={handleExportExcel}
                                    sx={{
                                        border: '1px solid',
                                        borderColor: 'divider',
                                        color: 'var(--text-primary)',
                                        bgcolor: 'transparent'
                                    }}
                                >
                                    <TableChartIcon fontSize="small" />
                                </IconButton>
                            </Tooltip>
                        )}
                    </Box>
                </Box>
            )}

            <TableContainer>
                <Table size="small" sx={{ borderCollapse: 'collapse' }}>
                    <TableHead>
                        <TableRow>
                            {tableColumns.map((column) => (
                                <TableCell
                                    key={column.field}
                                    sx={{
                                        fontWeight: 700,
                                        cursor: enableSorting && column.sortable ? 'pointer' : 'default',
                                        borderBottom: borderStyle.horizontal || '1px solid rgba(224, 224, 224, 1)',
                                        borderRight: borderStyle.vertical || 'none',
                                        ...headerStyle,
                                    }}
                                    onClick={() => handleSort(column.field)}
                                >
                                    {column.renderHeader ? column.renderHeader(column) : column.headerName}
                                    {enableSorting && column.sortable && sortConfig?.field === column.field ? (sortConfig.direction === 'asc' ? ' ↑' : ' ↓') : ''}
                                </TableCell>
                            ))}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {pagedRows.map((row, rowIndex) => (
                            <TableRow
                                key={rowIndex}
                                hover
                                onClick={() => { if (typeof onRowClick === 'function') onRowClick(row, rowIndex); }}
                                sx={{
                                    cursor: typeof onRowClick === 'function' ? 'pointer' : 'default',
                                    ...rowStyle,
                                    '& td': {
                                        borderBottom: borderStyle.horizontal || '1px solid rgba(224, 224, 224, 1)',
                                        borderRight: borderStyle.vertical || 'none',
                                        ...cellStyle,
                                    },
                                }}
                            >
                                {tableColumns.map((column) => (
                                    <TableCell
                                        key={`${rowIndex}-${column.field}`}
                                        sx={{ textAlign: column.align || 'left' }}
                                        onClick={(e) => { e.stopPropagation(); if (typeof onCellClick === 'function') onCellClick(row[column.field], row, column); }}
                                    >
                                        {column.renderCell ? column.renderCell(row[column.field], row, column) : formatCellValue(row[column.field], column)}
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            {enablePagination && (
                <TablePagination
                    component="div"
                    count={filteredRows.length}
                    page={page}
                    onPageChange={handleChangePage}
                    rowsPerPage={rowsPerPage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                    rowsPerPageOptions={rowsPerPageOptions}
                />
            )}
        </Paper>
    );
}

export default DataTable;