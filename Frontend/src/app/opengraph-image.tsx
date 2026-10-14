import { ImageResponse } from 'next/og';
export const alt = 'Elementry Media Technology — Broadcast Solutions';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        background: '#10283f',
        color: '#f5f9fc',
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: 90,
      }}
    >
      <div style={{ fontSize: 34, color: '#8edbd1' }}>Elementry.MEDIA</div>
      <div style={{ fontSize: 80, fontWeight: 700, marginTop: 48 }}>
        Professional Broadcast Solutions.
      </div>
    </div>,
    size,
  );
}
