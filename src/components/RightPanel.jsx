import React, { useState, useEffect, useRef } from 'react';
import {
  Terminal,
  Activity,
  CheckCircle2,
  XCircle,
  Clock,
  Copy,
  Trash2,
  Download,
  Filter,
  Search,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Send,
  FileText,
  Code2,
  Server
} from 'lucide-react';

export default function RightPanel({
  logs = [],
  certificates = {},
  onClearLogs,
  onViewCert
}) {
  const [selectedLog, setSelectedLog] = useState(null);
  const [activeTab, setActiveTab] = useState('feed'); // 'feed' | 'inspector' | 'vault'
  const [filterStage, setFilterStage] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [autoScroll, setAutoScroll] = useState(true);
  const [copiedId, setCopiedId] = useState(null);
  const feedEndRef = useRef(null);

  // Auto scroll when new logs arrive if enabled
  useEffect(() => {
    if (autoScroll && activeTab === 'feed' && feedEndRef.current) {
      feedEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll, activeTab]);

  // If a log is emitted and none is selected, select the latest
  useEffect(() => {
    if (logs.length > 0 && !selectedLog) {
      setSelectedLog(logs[0]);
    }
  }, [logs]);

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleExportLogs = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(logs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `postman_acknowledgments_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const filteredLogs = logs.filter(log => {
    if (filterStage !== 'ALL') {
      if (filterStage === 'ERRORS' && log.status < 400 && !log.error) return false;
      if (filterStage !== 'ERRORS' && log.stage !== filterStage) return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchUrl = log.url && log.url.toLowerCase().includes(q);
      const matchAction = log.action && log.action.toLowerCase().includes(q);
      const matchStatus = log.status && String(log.status).includes(q);
      const matchStage = log.stage && log.stage.toLowerCase().includes(q);
      return matchUrl || matchAction || matchStatus || matchStage;
    }
    return true;
  });

  const getStageColor = (stage) => {
    switch (stage) {
      case 'SCADA_API': return '#ff8555';
      case 'MEDHA_SERVER': return '#38bdf8';
      case 'ZIP_EXTRACTION': return '#a855f7';
      case 'WIRELESS_TRANSFER': return '#10b981';
      default: return '#94a3b8';
    }
  };

  return (
    <div style={{
      width: '50%',
      height: '100%',
      background: '#0a0d14',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      {/* Top Header of Right Console */}
      <div style={{
        padding: '10px 16px',
        background: '#111520',
        borderBottom: '1px solid #232b3b',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0
      }}>
        {/* Navigation Tabs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <button
            onClick={() => setActiveTab('feed')}
            style={{
              background: activeTab === 'feed' ? '#21293b' : 'transparent',
              color: activeTab === 'feed' ? '#ff8555' : '#94a3b8',
              border: 'none',
              padding: '6px 12px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Activity size={14} />
            <span>Activity & Acknowledgment Log</span>
            <span style={{
              background: '#2b364e',
              color: '#f8fafc',
              fontSize: '10px',
              padding: '1px 5px',
              borderRadius: '10px'
            }}>
              {logs.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('inspector')}
            style={{
              background: activeTab === 'inspector' ? '#21293b' : 'transparent',
              color: activeTab === 'inspector' ? '#38bdf8' : '#94a3b8',
              border: 'none',
              padding: '6px 12px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Terminal size={14} />
            <span>Response Inspector</span>
            {selectedLog && (
              <span className="mono" style={{
                fontSize: '10px',
                color: selectedLog.status >= 200 && selectedLog.status < 300 ? '#34d399' : '#f43f5e'
              }}>
                {selectedLog.status || 'LOG'}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('vault')}
            style={{
              background: activeTab === 'vault' ? '#21293b' : 'transparent',
              color: activeTab === 'vault' ? '#34d399' : '#94a3b8',
              border: 'none',
              padding: '6px 12px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <ShieldCheck size={14} />
            <span>Certificate Vault</span>
          </button>
        </div>

        {/* Action icons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={handleExportLogs}
            disabled={logs.length === 0}
            style={{
              background: '#19202f',
              border: '1px solid #2b3548',
              color: '#cbd5e1',
              padding: '4px 8px',
              borderRadius: '4px',
              fontSize: '11px',
              fontWeight: 600,
              cursor: logs.length === 0 ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
            title="Export all acknowledgments to JSON"
          >
            <Download size={12} />
            <span>Export</span>
          </button>

          <button
            onClick={onClearLogs}
            disabled={logs.length === 0}
            style={{
              background: '#19202f',
              border: '1px solid #2b3548',
              color: '#f43f5e',
              padding: '4px 8px',
              borderRadius: '4px',
              fontSize: '11px',
              fontWeight: 600,
              cursor: logs.length === 0 ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
            title="Clear all logs"
          >
            <Trash2 size={12} />
            <span>Clear</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar (Only shown in Feed view) */}
      {activeTab === 'feed' && (
        <div style={{
          padding: '8px 16px',
          background: '#0d111a',
          borderBottom: '1px solid #1e2638',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          flexShrink: 0
        }}>
          {/* Stage Filter Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', overflowX: 'auto' }}>
            {['ALL', 'SCADA_API', 'MEDHA_SERVER', 'ZIP_EXTRACTION', 'WIRELESS_TRANSFER', 'ERRORS'].map((stage) => (
              <button
                key={stage}
                onClick={() => setFilterStage(stage)}
                style={{
                  background: filterStage === stage ? '#242c3f' : '#141824',
                  color: filterStage === stage ? '#ff8555' : '#64748b',
                  border: '1px solid',
                  borderColor: filterStage === stage ? '#ff855555' : '#232b3b',
                  fontSize: '10.5px',
                  fontWeight: 600,
                  padding: '3px 8px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                {stage.replace('_', ' ')}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div style={{
            position: 'relative',
            width: '180px',
            display: 'flex',
            alignItems: 'center'
          }}>
            <Search size={12} color="#64748b" style={{ position: 'absolute', left: '8px' }} />
            <input
              type="text"
              placeholder="Search URL or status..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                background: '#131824',
                border: '1px solid #232b3b',
                borderRadius: '4px',
                color: '#f8fafc',
                padding: '4px 8px 4px 26px',
                fontSize: '11px'
              }}
            />
          </div>
        </div>
      )}

      {/* TAB 1: ACTIVITY & ACKNOWLEDGMENT FEED */}
      {activeTab === 'feed' && (
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px' }}>
          {filteredLogs.length === 0 ? (
            <div style={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#475569',
              textAlign: 'center',
              padding: '40px'
            }}>
              <Terminal size={40} strokeWidth={1.5} style={{ marginBottom: '12px', opacity: 0.6 }} />
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#94a3b8' }}>
                No Activity Recorded Yet
              </div>
              <div style={{ fontSize: '12px', color: '#64748b', maxWidth: '320px', marginTop: '6px' }}>
                Requests and responses from Medha Server, SCADA API, and Wireless endpoints will be captured and acknowledged here in real time.
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {filteredLogs.map((log) => {
                const isSelected = selectedLog && selectedLog.id === log.id;
                const isError = log.status >= 400 || log.error || log.type.includes('error');
                const isSuccess = log.status >= 200 && log.status < 300 || log.acknowledged;

                return (
                  <div
                    key={log.id}
                    onClick={() => {
                      setSelectedLog(log);
                      setActiveTab('inspector');
                    }}
                    style={{
                      background: isSelected ? '#151b28' : '#0f131d',
                      border: isSelected ? '1px solid #ff8555' : '1px solid #1e2637',
                      borderRadius: '6px',
                      padding: '10px 12px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {/* Top Row: Method, Stage, Status, Timestamp */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {log.method && (
                          <span className={`mono ${log.method === 'GET' ? 'badge-get' : 'badge-post'}`} style={{
                            fontSize: '9.5px',
                            padding: '1px 5px',
                            borderRadius: '3px',
                            fontWeight: 700
                          }}>
                            {log.method}
                          </span>
                        )}

                        <span style={{
                          fontSize: '10px',
                          fontWeight: 700,
                          color: getStageColor(log.stage),
                          background: `${getStageColor(log.stage)}15`,
                          padding: '1px 6px',
                          borderRadius: '3px',
                          border: `1px solid ${getStageColor(log.stage)}33`
                        }}>
                          {log.stage || 'EVENT'}
                        </span>

                        {log.status && (
                          <span className="mono" style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            color: isSuccess ? '#34d399' : '#f43f5e',
                            background: isSuccess ? 'rgba(52,211,153,0.1)' : 'rgba(244,63,94,0.1)',
                            padding: '1px 6px',
                            borderRadius: '3px'
                          }}>
                            {log.status} {log.statusText || (isSuccess ? 'OK' : 'FAIL')}
                          </span>
                        )}

                        {log.durationMs !== undefined && (
                          <span className="mono" style={{ fontSize: '10px', color: '#64748b' }}>
                            {log.durationMs}ms
                          </span>
                        )}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span className="mono" style={{ fontSize: '10px', color: '#64748b' }}>
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </span>
                        <ChevronRight size={13} color="#475569" />
                      </div>
                    </div>

                    {/* Action Description */}
                    <div style={{ fontSize: '12.5px', fontWeight: 600, color: '#f1f5f9', marginBottom: '4px' }}>
                      {log.action}
                    </div>

                    {/* URL Snippet */}
                    {log.url && (
                      <div className="mono" style={{
                        fontSize: '10.5px',
                        color: '#38bdf8',
                        background: '#0a0d14',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        border: '1px solid #1a2233',
                        marginBottom: '4px'
                      }}>
                        {log.url}
                      </div>
                    )}

                    {/* Error or Preview Snippet */}
                    {log.error && (
                      <div style={{
                        fontSize: '11px',
                        color: '#f87171',
                        background: 'rgba(244, 63, 94, 0.1)',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        marginTop: '4px'
                      }}>
                        Error: {log.error}
                      </div>
                    )}

                    {log.preview && (
                      <pre className="mono" style={{
                        fontSize: '10px',
                        color: '#94a3b8',
                        background: '#090c13',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        maxHeight: '44px',
                        overflow: 'hidden',
                        whiteSpace: 'pre-wrap',
                        border: '1px solid #161c28'
                      }}>
                        {log.preview}
                      </pre>
                    )}
                  </div>
                );
              })}
              <div ref={feedEndRef} />
            </div>
          )}
        </div>
      )}

      {/* TAB 2: DETAILED RESPONSE INSPECTOR */}
      {activeTab === 'inspector' && (
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {selectedLog ? (
            <>
              {/* Summary Card */}
              <div style={{
                background: '#121723',
                border: '1px solid #232b3b',
                borderRadius: '8px',
                padding: '14px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {selectedLog.method && (
                      <span className={`mono ${selectedLog.method === 'GET' ? 'badge-get' : 'badge-post'}`} style={{
                        fontSize: '11px',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontWeight: 800
                      }}>
                        {selectedLog.method}
                      </span>
                    )}
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#f8fafc' }}>
                      {selectedLog.action}
                    </span>
                  </div>

                  {selectedLog.status && (
                    <span className="mono" style={{
                      fontSize: '12px',
                      fontWeight: 800,
                      color: selectedLog.status < 400 ? '#34d399' : '#f43f5e',
                      background: selectedLog.status < 400 ? 'rgba(52,211,153,0.15)' : 'rgba(244,63,94,0.15)',
                      padding: '2px 8px',
                      borderRadius: '4px'
                    }}>
                      HTTP {selectedLog.status} {selectedLog.statusText || ''}
                    </span>
                  )}
                </div>

                <div className="mono" style={{
                  fontSize: '11px',
                  color: '#38bdf8',
                  wordBreak: 'break-all',
                  background: '#0a0d14',
                  padding: '8px 10px',
                  borderRadius: '5px',
                  border: '1px solid #1e2638',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '8px'
                }}>
                  <span>{selectedLog.url || 'No Direct URL (Local / Extraction Process)'}</span>
                  {selectedLog.url && (
                    <button
                      onClick={() => handleCopy(selectedLog.url, 'insp-url')}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: copiedId === 'insp-url' ? '#34d399' : '#64748b',
                        cursor: 'pointer'
                      }}
                      title="Copy URL"
                    >
                      {copiedId === 'insp-url' ? <CheckCircle2 size={13} /> : <Copy size={13} />}
                    </button>
                  )}
                </div>

                {/* Metadata Row */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '8px',
                  marginTop: '10px',
                  fontSize: '11px'
                }}>
                  <div style={{ background: '#0a0d14', padding: '6px 8px', borderRadius: '4px', border: '1px solid #1a2233' }}>
                    <span style={{ color: '#64748b', display: 'block' }}>Stage:</span>
                    <span style={{ fontWeight: 700, color: getStageColor(selectedLog.stage) }}>{selectedLog.stage}</span>
                  </div>
                  <div style={{ background: '#0a0d14', padding: '6px 8px', borderRadius: '4px', border: '1px solid #1a2233' }}>
                    <span style={{ color: '#64748b', display: 'block' }}>Duration:</span>
                    <span className="mono" style={{ fontWeight: 700, color: '#f8fafc' }}>
                      {selectedLog.durationMs !== undefined ? `${selectedLog.durationMs} ms` : 'N/A'}
                    </span>
                  </div>
                  <div style={{ background: '#0a0d14', padding: '6px 8px', borderRadius: '4px', border: '1px solid #1a2233' }}>
                    <span style={{ color: '#64748b', display: 'block' }}>Timestamp:</span>
                    <span className="mono" style={{ fontWeight: 700, color: '#f8fafc' }}>
                      {new Date(selectedLog.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Response Headers */}
              {selectedLog.headers && (
                <div style={{
                  background: '#121723',
                  border: '1px solid #232b3b',
                  borderRadius: '8px',
                  padding: '14px'
                }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#94a3b8', marginBottom: '8px' }}>
                    Response Headers
                  </div>
                  <pre className="mono" style={{
                    fontSize: '11px',
                    color: '#a5b4fc',
                    background: '#0a0d14',
                    padding: '8px',
                    borderRadius: '5px',
                    maxHeight: '120px',
                    overflowY: 'auto'
                  }}>
                    {JSON.stringify(selectedLog.headers, null, 2)}
                  </pre>
                </div>
              )}

              {/* Response Body / Acknowledgment Payload */}
              <div style={{
                background: '#121723',
                border: '1px solid #232b3b',
                borderRadius: '8px',
                padding: '14px',
                flex: 1,
                display: 'flex',
                flexDirection: 'column'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#94a3b8' }}>
                    Acknowledgment / Response Payload
                  </div>
                  <button
                    onClick={() => handleCopy(
                      typeof (selectedLog.responseBody || selectedLog.preview || selectedLog.details) === 'string'
                        ? (selectedLog.responseBody || selectedLog.preview || selectedLog.details)
                        : JSON.stringify(selectedLog.responseBody || selectedLog.details || selectedLog, null, 2),
                      'insp-body'
                    )}
                    style={{
                      background: '#1a2233',
                      border: '1px solid #28344c',
                      color: copiedId === 'insp-body' ? '#34d399' : '#cbd5e1',
                      padding: '3px 8px',
                      borderRadius: '4px',
                      fontSize: '10.5px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    {copiedId === 'insp-body' ? <CheckCircle2 size={12} /> : <Copy size={12} />}
                    <span>{copiedId === 'insp-body' ? 'Copied' : 'Copy Payload'}</span>
                  </button>
                </div>

                <pre className="mono" style={{
                  flex: 1,
                  fontSize: '11px',
                  color: '#34d399',
                  background: '#080b11',
                  border: '1px solid #1c2435',
                  borderRadius: '6px',
                  padding: '12px',
                  overflowY: 'auto',
                  whiteSpace: 'pre-wrap',
                  lineHeight: 1.45
                }}>
                  {selectedLog.responseBody
                    ? (typeof selectedLog.responseBody === 'string'
                        ? selectedLog.responseBody
                        : JSON.stringify(selectedLog.responseBody, null, 2))
                    : (selectedLog.preview || JSON.stringify(selectedLog, null, 2))}
                </pre>
              </div>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
              Select an activity from the feed to inspect full response and headers.
            </div>
          )}
        </div>
      )}

      {/* TAB 3: CERTIFICATE VAULT */}
      {activeTab === 'vault' && (
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#f8fafc', marginBottom: '2px' }}>
            Local Certificate Storage & Verification
          </div>
          <div style={{ fontSize: '11px', color: '#94a3b8' }}>
            Review certificates currently stored in memory and filesystem ready for wireless deployment:
          </div>

          {[
            { key: 'rootCA', name: 'rootCA.pem', cert: certificates.rootCA, label: 'Root Certificate Authority (rootCA.pem)' },
            { key: 'clientCert', name: 'client.pem', cert: certificates.clientCert, label: 'Client Authentication Certificate (client.pem)' },
            { key: 'privateKey', name: 'key.pem', cert: certificates.privateKey, label: 'Private Key RSA / ECDSA (key.pem)' }
          ].map((item) => {
            const hasData = item.cert && item.cert.content && item.cert.content.length > 0;
            return (
              <div
                key={item.key}
                style={{
                  background: '#121723',
                  border: hasData ? '1px solid rgba(52,211,153,0.3)' : '1px solid #232b3b',
                  borderRadius: '8px',
                  padding: '14px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <ShieldCheck size={16} color={hasData ? '#34d399' : '#64748b'} />
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#f8fafc' }}>
                      {item.label}
                    </span>
                  </div>

                  <span style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    color: hasData ? '#34d399' : '#64748b',
                    background: hasData ? 'rgba(52,211,153,0.1)' : 'rgba(100,116,139,0.1)',
                    padding: '2px 8px',
                    borderRadius: '12px'
                  }}>
                    {hasData ? `Ready (${item.cert.size} Bytes)` : 'Not Available'}
                  </span>
                </div>

                {hasData ? (
                  <>
                    <pre className="mono" style={{
                      fontSize: '10px',
                      color: '#a5b4fc',
                      background: '#090d15',
                      border: '1px solid #1d2537',
                      padding: '8px 10px',
                      borderRadius: '5px',
                      maxHeight: '70px',
                      overflow: 'hidden',
                      marginBottom: '8px'
                    }}>
                      {item.cert.content.substring(0, 200)}...
                    </pre>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => onViewCert(item.key, item.name, item.cert.content)}
                        style={{
                          background: '#1d2538',
                          border: '1px solid #2f3b54',
                          color: '#38bdf8',
                          padding: '4px 10px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          cursor: 'pointer',
                          fontWeight: 600
                        }}
                      >
                        Inspect Full PEM
                      </button>

                      <button
                        onClick={() => handleCopy(item.cert.content, item.key)}
                        style={{
                          background: '#1d2538',
                          border: '1px solid #2f3b54',
                          color: copiedId === item.key ? '#34d399' : '#cbd5e1',
                          padding: '4px 10px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          cursor: 'pointer',
                          fontWeight: 600
                        }}
                      >
                        {copiedId === item.key ? 'Copied' : 'Copy PEM Content'}
                      </button>
                    </div>
                  </>
                ) : (
                  <div style={{ fontSize: '11px', color: '#64748b' }}>
                    Download via SCADA API ctype URL or extract from Medha ZIP to populate.
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
