/* istanbul ignore file */
"use client";
import { useState } from 'react';
import { useToast } from '@/src/components/toast/ToastProvider';
import { ConfirmDialog } from '@/src/components/ConfirmDialog';
import { Button } from '@/src/components/ui/Button';
import { Toolbar } from '@/src/components/ui/Toolbar';
import { FileInput } from '@/src/components/ui/FileInput';
import { shapeMessage } from '@/src/lib/fieldErrors';
import { postJson } from '@/src/lib/api';
import { assetsSign, assetsConfirm } from '@/src/lib/apiPresets';

type Asset = {
  id: string;
  key: string;
  mime: string;
  size: number;
  createdAt: string;
};

export function AssetsClient({ workspaceId, initialAssets }: { workspaceId: string; initialAssets: Asset[] }) {
  const [assets, setAssets] = useState<Asset[]>(initialAssets);
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  const [confirming, setConfirming] = useState<string | null>(null);

  async function remove(id: string) {
    const res = await fetch(`/api/assets?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
    if (res.ok) {
      setAssets(assets.filter((a) => a.id !== id));
      toast.add('Asset deleted');
    } else {
      let data: unknown = null;
      try { data = await res.json(); } catch (_) {}
      const msg = shapeMessage(data, 'Failed to delete asset');
      toast.add(msg, 'danger');
    }
  }

  async function upload() {
    if (!file) return;
    setBusy(true);
    setStatus('Requesting signed URL…');
    try {
      const contentType = file.type || 'application/octet-stream';
      const sign = await assetsSign({ workspaceId, filename: file.name, contentType, size: file.size });
      if (!sign.ok) {
        const msg = sign.error.message || 'Failed to sign upload';
        setStatus(msg);
        toast.add(msg, 'danger');
        setBusy(false);
        return;
      }
      setStatus('Uploading to S3…');
      const put = await fetch(sign.data.uploadUrl, { method: 'PUT', headers: { 'Content-Type': contentType }, body: file });
      if (!put.ok) {
        const msg = `Upload failed (${put.status})`;
        setStatus(msg);
        toast.add(msg, 'danger');
        setBusy(false);
        return;
      }
      setStatus('Confirming upload…');
      const confirm = await assetsConfirm({ workspaceId, key: sign.data.key, mime: contentType, size: file.size });
      if (!confirm.ok) {
        const msg = confirm.error.message || 'Failed to confirm upload';
        setStatus(msg);
        toast.add(msg, 'danger');
        setBusy(false);
        return;
      }
      setAssets([confirm.data as any, ...assets]);
      setFile(null);
      setStatus('Uploaded');
      toast.add('Uploaded');
    } catch (e) {
      setStatus('Network error');
      toast.add('Network error', 'danger');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <Toolbar>
        <label htmlFor="asset-file" className="sr-only">Select file to upload</label>
        <FileInput
          id="asset-file"
          onChange={(f) => setFile(f)}
          accept=".png,.jpg,.jpeg,.webp,.pdf"
          aria-label="Select file to upload"
          style={{ maxWidth: 340 }}
        />
        <Button variant="primary" onClick={upload} disabled={!file} loading={busy}>Upload</Button>
        {status && <small className="muted">{status}</small>}
      </Toolbar>
      <ul>
        {assets.map((a) => (
          <li key={a.id} className="card" style={{ padding: 12, marginBottom: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div><strong>{a.key.split('/').slice(-1)[0]}</strong></div>
                <div className="muted"><small>{a.mime} — {(a.size / 1024).toFixed(1)} KB</small></div>
              </div>
              <div>
                <Button size="sm" variant="danger" onClick={() => setConfirming(a.id)}>Delete</Button>
              </div>
            </div>
          </li>
        ))}
        {assets.length === 0 && <li>No assets</li>}
      </ul>
      <ConfirmDialog
        open={!!confirming}
        title="Delete Asset"
        description="Are you sure you want to delete this asset? This action cannot be undone."
        confirmText="Delete"
        confirmVariant="danger"
        cancelText="Cancel"
        onCancel={() => setConfirming(null)}
        onConfirm={async () => {
          if (!confirming) return;
          const id = confirming;
          setConfirming(null);
          await remove(id);
        }}
      />
    </div>
  );
}
