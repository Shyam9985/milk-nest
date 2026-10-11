import { useNavigate } from 'react-router-dom';
import Table from './Table';
import * as Icons from 'lucide-react';

function DataGrid({ title, subtitle, backRoute, columns = [], rows = [], loading = false, permissions = {},
    onAdd, onEdit, onDelete, addLabel = 'Add New', config = {} }) {

    const navigate = useNavigate();

    const canAdd = !!permissions?.can_insert && typeof onAdd === 'function';
    const canEdit = !!permissions?.can_update && typeof onEdit === 'function';
    const canDelete = !!permissions?.can_delete && typeof onDelete === 'function';

    const gridColumns = [...columns];

    // actions column is rendered only when the user holds the respective permissions
    if (canEdit || canDelete) {

        gridColumns.push({
            label: 'Actions', field: 'actions', sortable: false, searchable: false, exportable: false, align: 'center',
            renderCell: (_value, row) => (

                <div className="flex items-center justify-center gap-1">

                    {canEdit && (
                        <button type="button" title="Edit"
                            onClick={(e) => { e.stopPropagation(); onEdit(row); }}
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-secondary)]
                                transition-colors hover:bg-[var(--hover-bg)] hover:text-[var(--brand-primary)]">
                            <Icons.Pencil size={16} />
                        </button>
                    )}

                    {canDelete && (
                        <button type="button" title="Delete"
                            onClick={(e) => { e.stopPropagation(); onDelete(row); }}
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-secondary)]
                                transition-colors hover:bg-[var(--hover-bg)] hover:text-[var(--danger)]">
                            <Icons.Trash2 size={16} />
                        </button>
                    )}

                </div>
            )
        });
    }

    const gridConfig = {
        search: true,
        pagination: true,
        sorting: true,
        exportExcel: true,
        exportFileName: title ? title.toLowerCase().replace(/\s+/g, '-') : undefined,
        loading,
        ...config
    };

    return (

        <div className="space-y-4">

            <div className="flex flex-wrap items-center justify-between gap-3">

                <div className="flex items-center gap-3">

                    {backRoute && (
                        <button type="button" title="Back" onClick={() => navigate(backRoute)}
                            className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--card-border)]
                                text-[var(--text-secondary)] transition-colors hover:bg-[var(--hover-bg)] hover:text-[var(--text-primary)]">
                            <Icons.ArrowLeft size={18} />
                        </button>
                    )}

                    <div>

                        {title && (
                            <h2 className="text-xl font-semibold text-[var(--text-primary)]">
                                {title}
                            </h2>
                        )}

                        {subtitle && (
                            <p className="mt-1 text-sm text-[var(--text-secondary)]">
                                {subtitle}
                            </p>
                        )}

                    </div>

                </div>

                {canAdd && (
                    <button type="button" onClick={onAdd}
                        className="flex items-center gap-2 rounded-lg bg-[var(--btn-primary-bg)] px-4 py-2 text-sm font-medium
                            text-[var(--btn-primary-text)] shadow-sm transition-all duration-200 hover:opacity-90
                            hover:shadow-md active:scale-95">
                        <Icons.Plus size={16} />
                        {addLabel}
                    </button>
                )}

            </div>

            <Table columns={gridColumns} data={rows} config={gridConfig} />

        </div>
    );
}

export default DataGrid;
