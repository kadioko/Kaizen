import React from 'react';
import { render, screen } from '@testing-library/react';
import { Button } from './components/ui/button';

test('renders branded action buttons', () => {
  render(<Button variant="gold">Open Paper Trade</Button>);
  expect(screen.getByRole('button', { name: /open paper trade/i })).toBeInTheDocument();
});
