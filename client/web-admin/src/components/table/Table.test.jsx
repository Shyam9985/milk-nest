import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Table from './Table';

describe('Table', () => {
  it('filters rows when search is enabled', async () => {
    const user = userEvent.setup();
    const data = [
      { make: 'Tesla', model: 'Model Y', price: 64950, electric: 'Yes' },
      { make: 'Ford', model: 'F-Series', price: 33850, electric: 'No' },
    ];

    render(
      <Table
        data={data}
        columns={[
          { label: 'Make', field: 'make' },
          { label: 'Price', field: 'price', type: 'number' },
        ]}
        config={{ search: true, pagination: false }}
      />
    );

    const searchInput = screen.getByPlaceholderText(/search/i);
    await user.type(searchInput, 'ford');

    expect(screen.getByText('Ford')).toBeInTheDocument();
    expect(screen.queryByText('Tesla')).not.toBeInTheDocument();
  });
});
