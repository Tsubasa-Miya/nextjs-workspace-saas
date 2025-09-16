"use client";
import type { ReactNode } from 'react';
import { Modal } from './Modal';
import { Button } from './ui/Button';

export function ConfirmDialog({
  open,
  title = 'Confirm',
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  confirmVariant = 'primary',
}: {
  open: boolean;
  title?: string;
  description?: string | ReactNode;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
  confirmVariant?: 'default' | 'primary' | 'danger' | 'ghost';
}) {
  return (
    <Modal open={open} onClose={onCancel} title={title} width={480}>
      {typeof description === 'string' ? <p style={{ marginTop: 0 }}>{description}</p> : description}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 12 }}>
        <Button onClick={onCancel} type="button">{cancelText}</Button>
        <Button variant={confirmVariant} onClick={onConfirm} type="button">{confirmText}</Button>
      </div>
    </Modal>
  );
}
