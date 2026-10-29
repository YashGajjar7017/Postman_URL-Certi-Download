import React, { useState } from 'react';
import {
  Download,
  Upload,
  FileArchive,
  Key,
  Shield,
  FileText,
  Send,
  Eye,
  CheckCircle2,
  Clock,
  AlertCircle,
  ExternalLink,
  Settings,
  FolderOpen,
  Copy,
  ChevronDown,
  ChevronUp,
  RefreshCw
} from 'lucide-react';

export default function LeftPanel({
  config,
  setConfig,
  certificates,
  onDownloadSingle,
  onDownloadAll,
  onDownloadMedhaZip,
  onUploadZipManual,
  onWirelessTransfer,
  wirelessUrl,
  setWirelessUrl,
  wirelessMode,
  setWirelessMode,
  onViewCert,
  isDownloadingAll,
  isTransferring,
  isMedhaLoading,
  activeDownloadCtype
}) {
  const [showConfig, setShowConfig] = useState(false);
  const [activeSourceTab, setActiveSourceTab] = useState('direct'); // 'direct' | 'medha' | 'zip'
  const [medhaUrl, setMedhaUrl] = useState(`https://api.iotscada-pmsg.com/api/SSLCert/downloadzip?imei=${config.imei}`);
  const [copiedUrlIndex, setCopiedUrlIndex] = useState(null);

  // Generate full URL dynamically based on config
  const getCertUrl = (ctype) => {
    return `https://api.iotscada-pmsg.com/api/SSLCert/certdownload?imei=${encodeURIComponent(config.imei)}&user=${encodeURIComponent(config.user)}&pass=${encodeURIComponent(config.pass)}&ctype=${ctype}&PROJCD=${encodeURIComponent(config.projcd)}`;
  };

  const certItems = [
    {
      id: 'rootCA',
      ctype: 1,
      filename: 'rootCA.pem',
      title: '1. Root CA Certificate (rootCA.pem)',
      icon: Shield,
      accent: '#34d399',
      data: certificates.rootCA,
      url: getCertUrl(1)
    },
    {
      id: 'clientCert',
      ctype: 2,
      filename: 'client.pem',
      title: '2. Client Certificate (client.pem)',
      icon: FileText,
      accent: '#38bdf8',
      data: certificates.clientCert,
      url: getCertUrl(2)
    },
    {
      id: 'privateKey',
      ctype: 3,
      filename: 'key.pem',
      title: '3. Private Key (key.pem)',
      icon: Key,
      accent: '#fbbf24',
      data: certificates.privateKey,
      url: getCertUrl(3)
    }
  ];

  const handleCopy = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedUrlIndex(idx);
    setTimeout(() => setCopiedUrlIndex(null), 2000);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      onUploadZipManual(event.target.result, file.name);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div style={{
      width: '50%',
      minWidth: '480px',
      height: '100%',
      borderRight: '1px solid #232b3b',
      background: '#0d1117',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      {/* Top Header / Credentials Toggle */}
      <div style={{
        padding: '12px 16px',
        background: '#131823',
        borderBottom: '1px solid #232b3b',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Settings size={15} color="#94a3b8" />
          <span style={{ fontSize: '13px', fontWeight: 700, color: '#f1f5f9' }}>
            SCADA Parameters & Credentials
          </span>
          <span className="mono" style={{ fontSize: '11px', color: '#ff8555', background: '#251b18', padding: '1px 6px', borderRadius: '4px' }}>
            IMEI: {config.imei}
          </span>
        </div>
        <button
          onClick={() => setShowConfig(!showConfig)}
          style={{
            background: 'none',
            border: 'none',
            color: '#94a3b8',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '12px',
            padding: '4px 8px',
            borderRadius: '4px'
          }}
        >
          {showConfig ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          <span>{showConfig ? 'Hide Config' : 'Edit Query Params'}</span>
        </button>
      </div>

      {/* Expandable Config Settings */}
      {showConfig && (
        <div style={{
          padding: '14px 16px',
          background: '#10141f',
          borderBottom: '1px solid #232b3b',
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '10px'
        }}>
          <div>
            <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
              IMEI
            </label>
            <input
              type="text"
              value={config.imei}
              onChange={(e) => setConfig({ ...config, imei: e.target.value })}
              className="mono"
              style={{
                width: '100%',
                background: '#0a0d14',
                border: '1px solid #2c364c',
                borderRadius: '4px',
                color: '#f8fafc',
                padding: '6px 8px',
                fontSize: '11px'
              }}
            />
          </div>
          <div>
            <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
              USER
            </label>
            <input
              type="text"
              value={config.user}
              onChange={(e) => setConfig({ ...config, user: e.target.value })}
              className="mono"
              style={{
                width: '100%',
                background: '#0a0d14',
                border: '1px solid #2c364c',
                borderRadius: '4px',
                color: '#f8fafc',
                padding: '6px 8px',
                fontSize: '11px'
              }}
            />
          </div>
          <div>
            <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
              PASS
            </label>
            <input
              type="text"
              value={config.pass}
              onChange={(e) => setConfig({ ...config, pass: e.target.value })}
              className="mono"
              style={{
                width: '100%',
                background: '#0a0d14',
                border: '1px solid #2c364c',
                borderRadius: '4px',
                color: '#f8fafc',
                padding: '6px 8px',
                fontSize: '11px'
              }}
            />
          </div>
          <div>
            <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
              PROJCD
            </label>
            <input
              type="text"
              value={config.projcd}
              onChange={(e) => setConfig({ ...config, projcd: e.target.value })}
              className="mono"
              style={{
                width: '100%',
                background: '#0a0d14',
                border: '1px solid #2c364c',
                borderRadius: '4px',
                color: '#f8fafc',
                padding: '6px 8px',
                fontSize: '11px'
              }}
            />
          </div>
        </div>
      )}

      {/* Main Scrollable Area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

        {/* Top Tabs: Direct URLs vs 1st Medha Server ZIP vs 2nd Manual ZIP */}
        <div style={{
          background: '#131824',
          borderRadius: '8px',
          padding: '4px',
          display: 'flex',
          border: '1px solid #232b3b'
        }}>
          <button
            onClick={() => setActiveSourceTab('direct')}
            style={{
              flex: 1,
              padding: '6px 10px',
              border: 'none',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              background: activeSourceTab === 'direct' ? '#252e42' : 'transparent',
              color: activeSourceTab === 'direct' ? '#ff8555' : '#94a3b8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <Download size={14} />
            <span>Direct Postman URLs</span>
          </button>

          <button
            onClick={() => setActiveSourceTab('medha')}
            style={{
              flex: 1,
              padding: '6px 10px',
              border: 'none',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              background: activeSourceTab === 'medha' ? '#252e42' : 'transparent',
              color: activeSourceTab === 'medha' ? '#38bdf8' : '#94a3b8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <FileArchive size={14} />
            <span>1st: Medha Server ZIP</span>
          </button>

          <button
            onClick={() => setActiveSourceTab('zip')}
            style={{
              flex: 1,
              padding: '6px 10px',
              border: 'none',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              background: activeSourceTab === 'zip' ? '#252e42' : 'transparent',
              color: activeSourceTab === 'zip' ? '#34d399' : '#94a3b8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <Upload size={14} />
            <span>2nd: Manual ZIP Extract</span>
          </button>
        </div>

        {/* Tab 1: Medha Server ZIP Downloader */}
        {activeSourceTab === 'medha' && (
          <div style={{
            background: '#121722',
            border: '1px solid #1e293b',
            borderRadius: '8px',
            padding: '14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileArchive size={16} color="#38bdf8" />
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#f8fafc' }}>
                1st. Medha Server ZIP Downloader
              </span>
            </div>
            <p style={{ fontSize: '11.5px', color: '#94a3b8', lineHeight: 1.4 }}>
              Fetches the complete ZIP package directly from Medha server, saves it locally, and unpacks the 4 certificate files into your workspace.
            </p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                value={medhaUrl}
                onChange={(e) => setMedhaUrl(e.target.value)}
                placeholder="Medha Server ZIP URL"
                className="mono"
                style={{
                  flex: 1,
                  background: '#0a0d14',
                  border: '1px solid #283347',
                  borderRadius: '6px',
                  color: '#e2e8f0',
                  padding: '7px 10px',
                  fontSize: '11px'
                }}
              />
              <button
                onClick={() => onDownloadMedhaZip(medhaUrl)}
                disabled={isMedhaLoading}
                style={{
                  background: 'linear-gradient(135deg, #0284c7, #0369a1)',
                  color: '#fff',
                  border: 'none',
                  padding: '7px 14px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: isMedhaLoading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  whiteSpace: 'nowrap'
                }}
              >
                {isMedhaLoading ? <RefreshCw size={13} className="animate-spin" /> : <Download size={13} />}
                <span>Fetch & Unpack ZIP</span>
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: Manual ZIP Upload & Extraction */}
        {activeSourceTab === 'zip' && (
          <div style={{
            background: '#121722',
            border: '1px solid #1e293b',
            borderRadius: '8px',
            padding: '14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Upload size={16} color="#34d399" />
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#f8fafc' }}>
                2nd. Manual ZIP File Upload & Extraction (4 Files)
              </span>
            </div>
            <p style={{ fontSize: '11.5px', color: '#94a3b8', lineHeight: 1.4 }}>
              Upload any downloaded certificate ZIP file. The server automatically unzips it, extracts `rootCA.pem`, `client.pem`, `key.pem`, and other configuration certificates.
            </p>
            <div style={{
              border: '2px dashed #2a354b',
              borderRadius: '8px',
              padding: '18px',
              textAlign: 'center',
              background: '#0d111a',
              cursor: 'pointer',
              position: 'relative'
            }}>
              <input
                type="file"
                accept=".zip"
                onChange={handleFileChange}
                style={{
                  position: 'absolute',
                  inset: 0,
                  opacity: 0,
                  cursor: 'pointer',
                  width: '100%',
                  height: '100%'
                }}
              />
              <FileArchive size={28} color="#34d399" style={{ margin: '0 auto 8px' }} />
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#f8fafc' }}>
                Click to browse or drop ZIP archive here
              </div>
              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                Supports standard zip archives containing certificate files
              </div>
            </div>
          </div>
        )}

        {/* Section: Certificate Download Pipeline Cards (As requested by user) */}
        <div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '10px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                background: '#ff6c37',
                color: '#fff',
                fontSize: '11px',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                1
              </span>
              <span style={{ fontSize: '13px', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.2px' }}>
                Certificate Acquisition List (Download First)
              </span>
            </div>

            <button
              onClick={onDownloadAll}
              disabled={isDownloadingAll}
              style={{
                background: '#1f2638',
                border: '1px solid #323d54',
                color: '#ff8555',
                fontSize: '11px',
                fontWeight: 700,
                padding: '4px 10px',
                borderRadius: '4px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              {isDownloadingAll ? <RefreshCw size={12} className="animate-spin" /> : <Download size={12} />}
              <span>Download All 3</span>
            </button>
          </div>

          {/* List of 3 Certificates */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {certItems.map((item, idx) => {
              const isReady = item.data && item.data.content && item.data.content.length > 0;
              const isCurrentDownloading = activeDownloadCtype === item.ctype;
              const Icon = item.icon;

              return (
                <div
                  key={item.id}
                  style={{
                    background: '#131823',
                    border: isReady ? '1px solid rgba(52, 211, 153, 0.35)' : '1px solid #232b3b',
                    borderRadius: '8px',
                    padding: '12px 14px',
                    transition: 'all 0.2s ease',
                    boxShadow: isReady ? '0 0 12px rgba(52, 211, 153, 0.08)' : 'none'
                  }}
                >
                  {/* Top Bar of Card */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '6px',
                        background: `${item.accent}22`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <Icon size={14} color={item.accent} />
                      </div>
                      <span style={{ fontWeight: 700, fontSize: '13px', color: '#f1f5f9' }}>
                        {item.title}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {/* Status Badge */}
                      {isReady ? (
                        <span style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          background: 'rgba(52, 211, 153, 0.15)',
                          color: '#34d399',
                          fontSize: '11px',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: '12px',
                          border: '1px solid rgba(52, 211, 153, 0.3)'
                        }}>
                          <CheckCircle2 size={12} />
                          <span>Ready ({item.data.size} B)</span>
                        </span>
                      ) : (
                        <span style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          background: 'rgba(148, 163, 184, 0.1)',
                          color: '#94a3b8',
                          fontSize: '11px',
                          fontWeight: 600,
                          padding: '2px 8px',
                          borderRadius: '12px'
                        }}>
                          <Clock size={12} />
                          <span>Not Downloaded</span>
                        </span>
                      )}

                      {/* Download Single Button */}
                      <button
                        onClick={() => onDownloadSingle(item.ctype, item.url)}
                        disabled={isCurrentDownloading}
                        style={{
                          background: '#1d2433',
                          border: '1px solid #334155',
                          color: '#f8fafc',
                          padding: '4px 10px',
                          borderRadius: '5px',
                          fontSize: '11px',
                          fontWeight: 600,
                          cursor: isCurrentDownloading ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px'
                        }}
                      >
                        {isCurrentDownloading ? (
                          <>
                            <RefreshCw size={11} className="animate-spin" />
                            <span>Fetching...</span>
                          </>
                        ) : (
                          <>
                            <Download size={11} />
                            <span>Download</span>
                          </>
                        )}
                      </button>

                      {/* View PEM Content Button */}
                      {isReady && (
                        <button
                          onClick={() => onViewCert(item.id, item.filename, item.data.content)}
                          style={{
                            background: '#1d2433',
                            border: '1px solid #334155',
                            color: '#38bdf8',
                            padding: '4px 8px',
                            borderRadius: '5px',
                            fontSize: '11px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                          title="View Certificate Raw Content"
                        >
                          <Eye size={12} />
                          <span>View</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* URL Line Box */}
                  <div style={{
                    background: '#0a0d14',
                    border: '1px solid #1e2638',
                    borderRadius: '5px',
                    padding: '6px 10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '10px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden', flex: 1 }}>
                      <span className="mono badge-get" style={{ fontSize: '9.5px', padding: '1px 5px', borderRadius: '3px', fontWeight: 700 }}>
                        GET
                      </span>
                      <span className="mono" style={{
                        fontSize: '10.5px',
                        color: '#94a3b8',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {item.url}
                      </span>
                    </div>

                    <button
                      onClick={() => handleCopy(item.url, idx)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: copiedUrlIndex === idx ? '#34d399' : '#64748b',
                        cursor: 'pointer',
                        padding: '2px',
                        display: 'flex',
                        alignItems: 'center',
                        flexShrink: 0
                      }}
                      title="Copy URL"
                    >
                      {copiedUrlIndex === idx ? <CheckCircle2 size={13} /> : <Copy size={13} />}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Section: Wireless Transfer Destination (Below Certificates) */}
        <div style={{
          background: '#131823',
          border: '1px solid #232b3b',
          borderRadius: '10px',
          padding: '16px',
          marginTop: '4px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                background: '#0284c7',
                color: '#fff',
                fontSize: '11px',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                2
              </span>
              <div>
                <span style={{ fontSize: '13px', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.2px' }}>
                  Wireless Transfer Destination (Target Device URL)
                </span>
                <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                  Target wireless endpoint where downloaded certificates are dispatched
                </div>
              </div>
            </div>

            <span className="mono badge-post" style={{ fontSize: '10px', padding: '2px 7px', borderRadius: '4px', fontWeight: 700 }}>
              POST
            </span>
          </div>

          {/* Target URL Input */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div>
              <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
                Device Wireless Provisioning URL:
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  value={wirelessUrl}
                  onChange={(e) => setWirelessUrl(e.target.value)}
                  placeholder="e.g. http://192.168.4.1/api/certificates/provision"
                  className="mono"
                  style={{
                    flex: 1,
                    background: '#0a0d14',
                    border: '1px solid #2c364c',
                    borderRadius: '6px',
                    color: '#38bdf8',
                    padding: '8px 12px',
                    fontSize: '12px',
                    outline: 'none'
                  }}
                />
              </div>
            </div>

            {/* Quick URL Presets */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '11px', color: '#64748b' }}>Presets:</span>
              {[
                { label: 'IoT AP (192.168.4.1)', url: 'http://192.168.4.1/upload_cert' },
                { label: 'Local Gateway (:8080)', url: 'http://192.168.1.100:8080/api/cert/install' },
                { label: 'Local Mock Endpoint', url: 'http://localhost:5055/api/mock/device-ack' }
              ].map((preset, i) => (
                <button
                  key={i}
                  onClick={() => setWirelessUrl(preset.url)}
                  style={{
                    background: '#19202f',
                    border: '1px solid #2b3548',
                    color: '#94a3b8',
                    fontSize: '10px',
                    padding: '3px 8px',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {/* Transfer Format Mode */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: '#0d111a',
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid #1e2638'
            }}>
              <span style={{ fontSize: '11px', color: '#94a3b8' }}>Payload Delivery Format:</span>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  onClick={() => setWirelessMode('json')}
                  style={{
                    background: wirelessMode === 'json' ? '#0284c7' : '#1e2638',
                    color: wirelessMode === 'json' ? '#fff' : '#94a3b8',
                    border: 'none',
                    padding: '3px 8px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  JSON Bundle
                </button>
                <button
                  onClick={() => setWirelessMode('bundle')}
                  style={{
                    background: wirelessMode === 'bundle' ? '#0284c7' : '#1e2638',
                    color: wirelessMode === 'bundle' ? '#fff' : '#94a3b8',
                    border: 'none',
                    padding: '3px 8px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Concatenated PEM
                </button>
              </div>
            </div>

            {/* Send CTA Button */}
            <button
              onClick={onWirelessTransfer}
              disabled={isTransferring}
              style={{
                background: 'linear-gradient(135deg, #0284c7, #0369a1)',
                color: '#fff',
                border: 'none',
                padding: '10px 16px',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: isTransferring ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 4px 14px rgba(2, 132, 199, 0.35)',
                transition: 'all 0.15s ease'
              }}
            >
              {isTransferring ? (
                <>
                  <RefreshCw size={15} className="animate-spin" />
                  <span>Transmitting Certificates to Device...</span>
                </>
              ) : (
                <>
                  <Send size={15} />
                  <span>Transfer Certificates to Wireless Target</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
