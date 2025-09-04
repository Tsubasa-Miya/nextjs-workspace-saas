/* istanbul ignore file */
"use client";
import { useState } from 'react';

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

  async function remove(id: string) {
    const res = await fetch(`/api/assets?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
    if (res.ok) setAssets(assets.filter((a) => a.id !== id));
  }

  async function upload() {
    if (!file) return;
    setBusy(true);
    setStatus('Requesting signed URL…');
    try {
      const contentType = file.type || 'application/octet-stream';
      const res = await fetch('/api/assets/sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspaceId, filename: file.name, contentType, size: file.size }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus(data?.error ?? 'Failed to sign upload');
        setBusy(false);
        return;
      }
      setStatus('Uploading to S3…');
      const put = await fetch(data.uploadUrl, { method: 'PUT', headers: { 'Content-Type': contentType }, body: file });
      if (!put.ok) {
        setStatus(`Upload failed (${put.status})`);
        setBusy(false);
        return;
      }
      setStatus('Confirming upload…');
      const confRes = await fetch('/api/assets/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspaceId, key: data.key, mime: contentType, size: file.size }),
      });
      const asset = await confRes.json();
      if (!confRes.ok) {
        setStatus(asset?.error ?? 'Failed to confirm upload');
        setBusy(false);
        return;
      }
      setAssets([asset, ...assets]);
      setFile(null);
      setStatus('Uploaded');
    } catch (e) {
      setStatus('Network error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', gap: 8, alignItems: 'center' }}>
        <input
          type="file"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          accept=".png,.jpg,.jpeg,.webp,.pdf"
        />
        <button onClick={upload} disabled={!file || busy} style={{ padding: '6px 10px' }}>Upload</button>
        {status && <small>{status}</small>}
      </div>
      <ul>
        {assets.map((a) => (
          <li key={a.id} style={{ border: '1px solid #eee', padding: 8, marginBottom: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <div><strong>{a.key.split('/').slice(-1)[0]}</strong></div>
                <div><small>{a.mime} — {(a.size / 1024).toFixed(1)} KB</small></div>
              </div>
              <div>
                <button onClick={() => remove(a.id)} style={{ padding: '4px 8px' }}>Delete</button>
              </div>
            </div>
          </li>
        ))}
        {assets.length === 0 && <li>No assets</li>}
      </ul>
    </div>
  );
}
