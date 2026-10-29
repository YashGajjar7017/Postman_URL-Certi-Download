import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Header from './components/Header.jsx';
import LeftPanel from './components/LeftPanel.jsx';
import RightPanel from './components/RightPanel.jsx';
import CertificateModal from './components/CertificateModal.jsx';

const BACKEND_BASE = 'http://localhost:5055';

export default function App() {
  const [config, setConfig] = useState({
    imei: '869366088390823',
    user: '869366088390823',
    pass: 'd47db17',
    projcd: 're'
  });

  const [certificates, setCertificates] = useState({
    rootCA: { name: 'rootCA.pem', content: '', size: 0, status: 'idle' },
    clientCert: { name: 'client.pem', content: '', size: 0, status: 'idle' },
    privateKey: { name: 'key.pem', content: '', size: 0, status: 'idle' },
    additional: []
  });

  const [logs, setLogs] = useState([]);
  const [wirelessUrl, setWirelessUrl] = useState('http://192.168.4.1/upload_cert');
  const [wirelessMode, setWirelessMode] = useState('json');
  const [isBackendConnected, setIsBackendConnected] = useState(false);
  const [isDownloadingAll, setIsDownloadingAll] = useState(false);
  const [isTransferring, setIsTransferring] = useState(false);
  const [isMedhaLoading, setIsMedhaLoading] = useState(false);
  const [activeDownloadCtype, setActiveDownloadCtype] = useState(null);
  const [wirelessOk, setWirelessOk] = useState(false);

  // Modal State
  const [modalState, setModalState] = useState({
    isOpen: false,
    key: null,
    filename: '',
    content: ''
  });

  // 1. Initial connect and SSE real-time stream
  useEffect(() => {
    // Initial fetch
    const fetchInitialData = async () => {
      try {
        const [certRes, logsRes] = await Promise.all([
          axios.get(`${BACKEND_BASE}/api/certificates`),
          axios.get(`${BACKEND_BASE}/api/logs`)
        ]);
        if (certRes.data?.certificates) {
          setCertificates(certRes.data.certificates);
        }
        if (logsRes.data?.logs) {
          setLogs(logsRes.data.logs);
        }
        setIsBackendConnected(true);
      } catch (err) {
        setIsBackendConnected(false);
      }
    };

    fetchInitialData();
    const interval = setInterval(fetchInitialData, 5000);

    // SSE Stream for immediate live logging
    let eventSource;
    try {
      eventSource = new EventSource(`${BACKEND_BASE}/api/logs/stream`);
      eventSource.onmessage = (event) => {
        try {
          const newLog = JSON.parse(event.data);
          setLogs((prev) => [newLog, ...prev]);
          if (newLog.stage === 'WIRELESS_TRANSFER' && newLog.acknowledged) {
            setWirelessOk(true);
          }
        } catch (e) {
          // ignore
        }
      };
      eventSource.onerror = () => {
        // SSE error, will reconnect
      };
    } catch (e) {
      // fallback
    }

    return () => {
      clearInterval(interval);
      if (eventSource) eventSource.close();
    };
  }, []);

  // 2. Download Single Certificate (ctype 1, 2, or 3)
  const handleDownloadSingle = async (ctype, url) => {
    setActiveDownloadCtype(ctype);
    try {
      const res = await axios.post(`${BACKEND_BASE}/api/download/single`, {
        ctype,
        url,
        imei: config.imei,
        user: config.user,
        pass: config.pass,
        projcd: config.projcd
      });

      if (res.data?.certificate) {
        const keyMap = { 1: 'rootCA', 2: 'clientCert', 3: 'privateKey' };
        const key = keyMap[ctype];
        if (key) {
          setCertificates((prev) => ({
            ...prev,
            [key]: res.data.certificate
          }));
        }
      }
    } catch (err) {
      console.error('Download single failed:', err);
    } finally {
      setActiveDownloadCtype(null);
    }
  };

  // 3. Batch Download all 3 Certificates
  const handleDownloadAll = async () => {
    setIsDownloadingAll(true);
    try {
      const res = await axios.post(`${BACKEND_BASE}/api/download/all`, {
        imei: config.imei,
        user: config.user,
        pass: config.pass,
        projcd: config.projcd
      });

      if (res.data?.certificates) {
        setCertificates(res.data.certificates);
      }
    } catch (err) {
      console.error('Download all failed:', err);
    } finally {
      setIsDownloadingAll(false);
    }
  };

  // 4. Medha Server ZIP Download & Extraction
  const handleDownloadMedhaZip = async (medhaUrl) => {
    setIsMedhaLoading(true);
    try {
      const res = await axios.post(`${BACKEND_BASE}/api/medha/download-zip`, {
        medhaUrl,
        imei: config.imei
      });

      if (res.data?.certificates) {
        setCertificates(res.data.certificates);
      }
    } catch (err) {
      console.error('Medha download failed:', err);
    } finally {
      setIsMedhaLoading(false);
    }
  };

  // 5. Manual ZIP Upload & Extraction
  const handleUploadZipManual = async (base64, filename) => {
    try {
      const res = await axios.post(`${BACKEND_BASE}/api/zip/extract-manual`, {
        zipBase64: base64,
        filename
      });

      if (res.data?.certificates) {
        setCertificates(res.data.certificates);
      }
    } catch (err) {
      console.error('Manual zip extract failed:', err);
    }
  };

  // 6. Wireless Transfer to Target Device URL
  const handleWirelessTransfer = async () => {
    setIsTransferring(true);
    try {
      const res = await axios.post(`${BACKEND_BASE}/api/wireless/transfer`, {
        targetUrl: wirelessUrl,
        transferMode: wirelessMode
      });

      if (res.data?.success) {
        setWirelessOk(true);
      }
    } catch (err) {
      console.error('Wireless transfer failed:', err);
      setWirelessOk(false);
    } finally {
      setIsTransferring(false);
    }
  };

  // 7. Clear Logs
  const handleClearLogs = async () => {
    try {
      await axios.delete(`${BACKEND_BASE}/api/logs`);
      setLogs([]);
    } catch (err) {
      setLogs([]);
    }
  };

  // 8. Open Certificate Modal
  const handleViewCert = (key, filename, content) => {
    setModalState({
      isOpen: true,
      key,
      filename,
      content
    });
  };

  // 9. Save edited Certificate Content
  const handleSaveCertContent = async (key, content, name) => {
    try {
      await axios.post(`${BACKEND_BASE}/api/certificates/update`, {
        key,
        content,
        name
      });
      setCertificates((prev) => ({
        ...prev,
        [key]: {
          ...prev[key],
          content,
          size: content.length,
          status: 'ready'
        }
      }));
    } catch (err) {
      console.error('Cert update failed:', err);
    }
  };

  // Calculated Stats
  const readyCount = [
    certificates.rootCA?.content?.length > 0,
    certificates.clientCert?.content?.length > 0,
    certificates.privateKey?.content?.length > 0
  ].filter(Boolean).length;

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: '#0d1117',
      overflow: 'hidden'
    }}>
      {/* Top Postman Header */}
      <Header
        isBackendConnected={isBackendConnected}
        onDownloadAll={handleDownloadAll}
        onWirelessSync={handleWirelessTransfer}
        isDownloadingAll={isDownloadingAll}
        isTransferring={isTransferring}
        stats={{ readyCount, wirelessOk }}
      />

      {/* Main Body: 2 Split Panels (Left Side & Right Side) */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'row',
        overflow: 'hidden',
        position: 'relative'
      }}>
        {/* Left Side: Certificates to download first + Wireless Transfer URL below */}
        <LeftPanel
          config={config}
          setConfig={setConfig}
          certificates={certificates}
          onDownloadSingle={handleDownloadSingle}
          onDownloadAll={handleDownloadAll}
          onDownloadMedhaZip={handleDownloadMedhaZip}
          onUploadZipManual={handleUploadZipManual}
          onWirelessTransfer={handleWirelessTransfer}
          wirelessUrl={wirelessUrl}
          setWirelessUrl={setWirelessUrl}
          wirelessMode={wirelessMode}
          setWirelessMode={setWirelessMode}
          onViewCert={handleViewCert}
          isDownloadingAll={isDownloadingAll}
          isTransferring={isTransferring}
          isMedhaLoading={isMedhaLoading}
          activeDownloadCtype={activeDownloadCtype}
        />

        {/* Right Side: Acknowledgment of every URL & every process occurred */}
        <RightPanel
          logs={logs}
          certificates={certificates}
          onClearLogs={handleClearLogs}
          onViewCert={handleViewCert}
        />
      </div>

      {/* Certificate Viewer & Editor Modal */}
      <CertificateModal
        isOpen={modalState.isOpen}
        onClose={() => setModalState({ ...modalState, isOpen: false })}
        certKey={modalState.key}
        filename={modalState.filename}
        content={modalState.content}
        onSaveContent={handleSaveCertContent}
      />
    </div>
  );
}
