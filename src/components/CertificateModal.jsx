import React, { useState } from 'react';
import { X, Copy, CheckCircle2, Download, Shield, Edit3, Save } from 'lucide-react';

export default function CertificateModal({
  isOpen,
  onClose,
  certKey,
  filename,
  content,
  onSaveContent
}) {
  if (!isOpen) return null;

  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(content || '');

  const handleCopy = () => {
    navigator.clipboard.writeText(editedContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([editedContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || 'certificate.pem';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleSave = () => {
    if (onSaveContent) {
      onSaveContent(certKey, editedContent, filename);
    }
    setIsEditing(false);
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(5, 8, 14, 0.75)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '24px'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '720px',
        maxHeight: '85vh',
        background: '#121622',
        border: '1px solid #28334a',
        borderRadius: '12px',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 20px',
          background: '#151b2a',
          borderBottom: '1px solid #232b3b',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '6px',
              background: 'rgba(52, 211, 153, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Shield size={18} color="#34d399" />
            </div>
            <div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: '#f8fafc' }}>
                {filename || 'Certificate'}
              </div>
              <div className="mono" style={{ fontSize: '11px', color: '#94a3b8' }}>
                Size: {Buffer ? (new Blob([editedContent])).size : editedContent.length} bytes
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {isEditing ? (
              <button
                onClick={handleSave}
                style={{
                  background: '#10b981',
                  color: '#fff',
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
                <Save size={13} />
                <span>Save Changes</span>
              </button>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                style={{
                  background: '#1e2638',
                  border: '1px solid #2c3852',
                  color: '#94a3b8',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Edit3 size={13} />
                <span>Edit PEM</span>
              </button>
            )}

            <button
              onClick={handleCopy}
              style={{
                background: '#1e2638',
                border: '1px solid #2c3852',
                color: copied ? '#34d399' : '#cbd5e1',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              {copied ? <CheckCircle2 size={13} /> : <Copy size={13} />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>

            <button
              onClick={handleDownload}
              style={{
                background: '#1e2638',
                border: '1px solid #2c3852',
                color: '#38bdf8',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
              title="Save to file"
            >
              <Download size={13} />
              <span>Download</span>
            </button>

            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                color: '#64748b',
                padding: '4px',
                cursor: 'pointer',
                marginLeft: '8px'
              }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div style={{ flex: 1, padding: '16px', overflowY: 'auto', background: '#0a0d14' }}>
          {isEditing ? (
            <textarea
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              className="mono"
              style={{
                width: '100%',
                height: '400px',
                background: '#070a10',
                border: '1px solid #253046',
                borderRadius: '6px',
                color: '#34d399',
                padding: '12px',
                fontSize: '12px',
                lineHeight: 1.5,
                outline: 'none',
                resize: 'none'
              }}
            />
          ) : (
            <pre className="mono" style={{
              color: '#34d399',
              fontSize: '12px',
              lineHeight: 1.55,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-all',
              userSelect: 'text'
            }}>
              {editedContent || '// Empty content'}
            </pre>
          )}
        </div>

        {/* Footer info */}
        <div style={{
          padding: '10px 20px',
          background: '#0f1420',
          borderTop: '1px solid #1e2638',
          fontSize: '11px',
          color: '#64748b',
          display: 'flex',
          justifyContent: 'space-between'
        }}>
          <span>Standard X.509 Base64 Encoded Certificate / RSA Key</span>
          <span>Click anywhere outside or press X to close</span>
        </div>
      </div>
    </div>
  );
}
