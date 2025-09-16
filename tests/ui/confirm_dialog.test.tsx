import React from 'react';
import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import { ConfirmDialog } from '@/src/components/ConfirmDialog';

describe('UI/ConfirmDialog', () => {
  it('returns null when not open', () => {
    const html = renderToString(
      <ConfirmDialog open={false} onCancel={() => {}} onConfirm={() => {}} />
    );
    expect(html).toBe('');
  });

  it('renders title, description and buttons when open', () => {
    const html = renderToString(
      <ConfirmDialog
        open
        title="Delete Item"
        description="Are you sure?"
        confirmText="Delete"
        cancelText="Cancel"
        confirmVariant="danger"
        onCancel={() => {}}
        onConfirm={() => {}}
      />
    );
    expect(html).toContain('role="dialog"');
    expect(html).toContain('Delete Item');
    expect(html).toContain('Are you sure?');
    expect(html).toContain('Delete');
    expect(html).toContain('Cancel');
    // danger variant should apply class pattern from Button
    expect(html).toContain('btn-danger');
  });
});

