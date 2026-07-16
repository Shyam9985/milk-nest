import { useState } from 'react';
import Table from './Table';

function DataGrid(props) {

    // Row Data: The data to be displayed.
    const [rowData, setRowData] = useState([
        { make: 'Tesla', model: 'Model Y', price: 64950, electric: 'Yes' },
        { make: 'Ford', model: 'F-Series', price: 33850, electric: 'No' },
        { make: 'Ford', model: 'F-Series', price: 33850, electric: 'No' },
        { make: 'Toyota', model: 'Corolla', price: 29600, electric: 'N0' },
        { make: 'Tesla', model: 'Model Y', price: 64950, electric: 'Yes' },
        { make: 'Ford', model: 'F-Series', price: 33850, electric: 'No' },
        { make: 'Ford', model: 'F-Series', price: 33850, electric: 'No' },
        { make: 'Toyota', model: 'Corolla', price: 29600, electric: 'N0' },
        { make: 'Tesla', model: 'Model Y', price: 64950, electric: 'Yes' },
        { make: 'Ford', model: 'F-Series', price: 33850, electric: 'No' },
        { make: 'Ford', model: 'F-Series', price: 33850, electric: 'No' },
        { make: 'Toyota', model: 'Corolla', price: 29600, electric: 'N0' },
    ]);

    const columns = [
        { label: 'Make', field: 'make' },
        { label: 'Model', field: 'model' },
        { label: 'Price', field: 'price', type: 'number' },
        { label: 'Electric', field: 'electric' }
    ];

    const config = {
        search: true,
        pagination: true,
        sorting: true,
        selection: false,
        exportCsv: true,
        exportExcel: true,
        loading: false,
        emptyMessage: 'No vehicle records found',
        theme: 'light',
        headerStyle: { backgroundColor: '#f5f7fb', color: '#1f2937' },
        rowStyle: { '&:hover': { backgroundColor: '#f8fafc' } },
        cellStyle: { py: 1.25 },
        borderStyle: { horizontal: '1px solid #e5e7eb', vertical: '1px solid #e5e7eb' },
        onExportExcel: (rows, cols) => {
            console.log('Export Excel', rows, cols);
        },
    };

    return (
        <Table columns={columns} data={rowData} config={config} />
    );

}

export default DataGrid;