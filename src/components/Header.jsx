import React from 'react';
import { Radio, Download, Send, RefreshCw, Zap, ShieldCheck } from 'lucide-react';

export default function Header({
  isBackendConnected,
  onDownloadAll,
  onWirelessSync,
  isDownloadingAll,
  isTransferring,
  stats
}) {
  return (
    <header style={{
      height: '56px',
      background: '#131722',
      borderBottom: '1px solid #232b3b',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 20px',
      userSelect: 'none',
      flexShrink: 0
    }}>
      {/* Brand & Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div style={{
          width: '32px',
          height: '32px',
          borderRadius: '8px',
          background: 'linear-gradient(135deg, #ff6c37, #e05524)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 2px 10px rgba(255,108,55,0.3)'
        }}>
          <Zap size={18} color="#fff" />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontWeight: 800, fontSize: '15px', letterSpacing: '-0.2px', color: '#fff' }}>
              POSTMAN
            </span>
            <span style={{
              fontSize: '11px',
              padding: '2px 7px',
              borderRadius: '4px',
              background: '#232b3b',
              color: '#ff8555',
              fontWeight: 700,
              letterSpacing: '0.5px'
            }}>
              CERT-PROVISIONER
            </span>
          </div>
          <div style={{ fontSize: '11px', color: '#94a3b8' }}>
            Electron + MERN/Vite Certificate Downloader & Wireless Dispatcher
          </div>
        </div>
      </div>

      {/* Middle Stats Badges */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: '#0d1017',
          padding: '4px 12px',
          borderRadius: '20px',
          border: '1px solid #232b3b',
          fontSize: '12px'
        }}>
          <ShieldCheck size={14} color="#34d399" />
          <span style={{ color: '#94a3b8' }}>Certificates Ready:</span>
          <span style={{ fontWeight: 700, color: '#34d399' }}>{stats.readyCount} / 3</span>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: '#0d1017',
          padding: '4px 12px',
          borderRadius: '20px',
          border: '1px solid #232b3b',
          fontSize: '12px'
        }}>
          <Radio size={14} color={stats.wirelessOk ? '#34d399' : '#94a3b8'} />
          <span style={{ color: '#94a3b8' }}>Wireless Target:</span>
          <span style={{
            fontWeight: 600,
            color: stats.wirelessOk ? '#34d399' : '#f59e0b'
          }}>
            {stats.wirelessOk ? 'Acknowledged' : 'Standby'}
          </span>
        </div>

        {/* Backend health dot */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '12px',
          color: isBackendConnected ? '#34d399' : '#f43f5e'
        }}>
          <span style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: isBackendConnected ? '#10b981' : '#f43f5e',
            boxShadow: isBackendConnected ? '0 0 8px #10b981' : '0 0 8px #f43f5e'
          }} />
          <span style={{ fontWeight: 600 }}>
            {isBackendConnected ? 'Backend Online (Port 5055)' : 'Connecting...'}
          </span>
        </div>
      </div>

      {/* Quick Action Buttons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <button
          onClick={onDownloadAll}
          disabled={isDownloadingAll}
          style={{
            background: 'linear-gradient(135deg, #ff6c37, #e05524)',
            color: '#fff',
            border: 'none',
            padding: '7px 16px',
            borderRadius: '6px',
            fontSize: '13px',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: isDownloadingAll ? 'not-allowed' : 'pointer',
            opacity: isDownloadingAll ? 0.7 : 1,
            boxShadow: '0 2px 8px rgba(255,108,55,0.3)',
            transition: 'all 0.15s ease'
          }}
          title="Download RootCA, Client, and Key from IoT SCADA API"
        >
          {isDownloadingAll ? (
            <>
              <RefreshCw size={14} className="animate-spin" />
              <span>Downloading...</span>
            </>
          ) : (
            <>
              <Download size={14} />
              <span>Download 3 Certs</span>
            </>
          )}
        </button>

        <button
          onClick={onWirelessSync}
          disabled={isTransferring || stats.readyCount === 0}
          style={{
            background: stats.readyCount === 0 ? '#1f2633' : 'linear-gradient(135deg, #0284c7, #0369a1)',
            color: stats.readyCount === 0 ? '#64748b' : '#fff',
            border: 'none',
            padding: '7px 16px',
            borderRadius: '6px',
            fontSize: '13px',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: (isTransferring || stats.readyCount === 0) ? 'not-allowed' : 'pointer',
            boxShadow: stats.readyCount === 0 ? 'none' : '0 2px 8px rgba(2,132,199,0.3)',
            transition: 'all 0.15s ease'
          }}
          title={stats.readyCount === 0 ? 'Download or extract certs first' : 'Send certificates to wireless destination'}
        >
          {isTransferring ? (
            <>
              <RefreshCw size={14} className="animate-spin" />
              <span>Sending...</span>
            </>
          ) : (
            <>
              <Send size={14} />
              <span>Transfer to Device</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
}
