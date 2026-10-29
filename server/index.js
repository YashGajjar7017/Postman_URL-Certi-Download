const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const axios = require('axios');
const AdmZip = require('adm-zip');

const app = express();
const PORT = process.env.PORT || 5055;

// Create downloads directory
const DOWNLOAD_DIR = path.join(__dirname, '..', 'downloads');
const CERT_DIR = path.join(DOWNLOAD_DIR, 'certificates');
const EXTRACT_DIR = path.join(DOWNLOAD_DIR, 'extracted');
[DOWNLOAD_DIR, CERT_DIR, EXTRACT_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Memory state for logs and certificates
let activityLogs = [];
let certificatesStore = {
  rootCA: { name: 'rootCA.pem', content: '', size: 0, status: 'idle', url: '', updated: null },
  clientCert: { name: 'client.pem', content: '', size: 0, status: 'idle', url: '', updated: null },
  privateKey: { name: 'key.pem', content: '', size: 0, status: 'idle', url: '', updated: null },
  additional: []
};

// SSE Clients for real-time acknowledgment logs
let sseClients = [];

function emitLog(logEntry) {
  const logWithId = {
    id: 'log_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
    timestamp: new Date().toISOString(),
    ...logEntry
  };
  activityLogs.unshift(logWithId);
  if (activityLogs.length > 500) {
    activityLogs = activityLogs.slice(0, 500);
  }
  // Broadcast to SSE clients
  sseClients.forEach(res => {
    try {
      res.write(`data: ${JSON.stringify(logWithId)}\n\n`);
    } catch (e) {
      // client disconnected
    }
  });
  return logWithId;
}

// Custom Axios instance with disabled SSL rejection (for IoT / local devices)
const httpsAgent = new https.Agent({
  rejectUnauthorized: false
});

const apiClient = axios.create({
  httpsAgent,
  timeout: 30000
});

// 1. Get SSE stream for real-time live logs
app.get('/api/logs/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  sseClients.push(res);
  req.on('close', () => {
    sseClients = sseClients.filter(client => client !== res);
  });
});

// 2. Get current logs
app.get('/api/logs', (req, res) => {
  res.json({ logs: activityLogs });
});

// Clear logs
app.delete('/api/logs', (req, res) => {
  activityLogs = [];
  res.json({ success: true, message: 'Logs cleared' });
});

// 3. Get currently stored certificates
app.get('/api/certificates', (req, res) => {
  res.json({ certificates: certificatesStore });
});

// Helper: Map ctype to certificate type
const CTYPE_MAP = {
  '1': { key: 'rootCA', filename: 'rootCA.pem', label: 'Root CA Certificate' },
  '2': { key: 'clientCert', filename: 'client.pem', label: 'Client Certificate' },
  '3': { key: 'privateKey', filename: 'key.pem', label: 'Private Key' }
};

// 4. Download single certificate from SCADA API
app.post('/api/download/single', async (req, res) => {
  const { url, ctype, imei, user, pass, projcd } = req.body;
  
  let targetUrl = url;
  if (!targetUrl && imei && ctype) {
    targetUrl = `https://api.iotscada-pmsg.com/api/SSLCert/certdownload?imei=${encodeURIComponent(imei)}&user=${encodeURIComponent(user || imei)}&pass=${encodeURIComponent(pass || 'd47db17')}&ctype=${ctype}&PROJCD=${encodeURIComponent(projcd || 're')}`;
  }

  const mapping = CTYPE_MAP[String(ctype)] || { key: 'custom', filename: `cert_type_${ctype}.pem`, label: `Certificate ctype=${ctype}` };
  const startTime = Date.now();

  emitLog({
    type: 'request',
    stage: 'SCADA_API',
    action: `Initiating download: ${mapping.filename}`,
    url: targetUrl,
    method: 'GET',
    details: { ctype, filename: mapping.filename }
  });

  try {
    const response = await apiClient.get(targetUrl, { responseType: 'text' });
    const duration = Date.now() - startTime;
    const content = typeof response.data === 'string' ? response.data : JSON.stringify(response.data);

    // Save to disk
    const filePath = path.join(CERT_DIR, mapping.filename);
    fs.writeFileSync(filePath, content, 'utf8');

    // Update state
    if (certificatesStore[mapping.key]) {
      certificatesStore[mapping.key] = {
        name: mapping.filename,
        content: content,
        size: Buffer.byteLength(content, 'utf8'),
        status: 'downloaded',
        url: targetUrl,
        updated: new Date().toISOString()
      };
    }

    const ackLog = emitLog({
      type: 'response_success',
      stage: 'SCADA_API',
      action: `Successfully received ${mapping.filename}`,
      url: targetUrl,
      status: response.status,
      statusText: response.statusText,
      durationMs: duration,
      sizeBytes: Buffer.byteLength(content, 'utf8'),
      headers: response.headers,
      preview: content.length > 300 ? content.substring(0, 300) + '...\n[TRUNCATED]' : content,
      acknowledged: true,
      filePath
    });

    res.json({
      success: true,
      certificate: certificatesStore[mapping.key],
      log: ackLog
    });
  } catch (err) {
    const duration = Date.now() - startTime;
    const errMsg = err.response ? `HTTP ${err.response.status}: ${err.response.statusText}` : err.message;
    
    emitLog({
      type: 'response_error',
      stage: 'SCADA_API',
      action: `Failed download ${mapping.filename}`,
      url: targetUrl,
      status: err.response?.status || 500,
      durationMs: duration,
      error: errMsg,
      headers: err.response?.headers,
      preview: err.response?.data ? String(err.response.data).substring(0, 300) : null,
      acknowledged: false
    });

    res.status(err.response?.status || 500).json({
      success: false,
      error: errMsg,
      details: err.response?.data || err.message
    });
  }
});

// 5. Batch download all 3 certificates (Root CA, Client, Key)
app.post('/api/download/all', async (req, res) => {
  const { imei = '869366088390823', user = '869366088390823', pass = 'd47db17', projcd = 're' } = req.body;
  const ctypes = [1, 2, 3];
  const results = [];

  emitLog({
    type: 'batch_start',
    stage: 'SCADA_API',
    action: `Batch certificate acquisition started for IMEI ${imei}`,
    details: { imei, ctypes: [1, 2, 3] }
  });

  for (const ctype of ctypes) {
    const mapping = CTYPE_MAP[String(ctype)];
    const targetUrl = `https://api.iotscada-pmsg.com/api/SSLCert/certdownload?imei=${encodeURIComponent(imei)}&user=${encodeURIComponent(user)}&pass=${encodeURIComponent(pass)}&ctype=${ctype}&PROJCD=${encodeURIComponent(projcd)}`;
    const startTime = Date.now();

    try {
      const response = await apiClient.get(targetUrl, { responseType: 'text' });
      const duration = Date.now() - startTime;
      const content = typeof response.data === 'string' ? response.data : JSON.stringify(response.data);

      const filePath = path.join(CERT_DIR, mapping.filename);
      fs.writeFileSync(filePath, content, 'utf8');

      certificatesStore[mapping.key] = {
        name: mapping.filename,
        content: content,
        size: Buffer.byteLength(content, 'utf8'),
        status: 'downloaded',
        url: targetUrl,
        updated: new Date().toISOString()
      };

      emitLog({
        type: 'response_success',
        stage: 'SCADA_API',
        action: `[${ctype}/3] Downloaded ${mapping.filename}`,
        url: targetUrl,
        status: response.status,
        durationMs: duration,
        sizeBytes: Buffer.byteLength(content, 'utf8'),
        preview: content.length > 250 ? content.substring(0, 250) + '...' : content,
        acknowledged: true
      });

      results.push({ ctype, success: true, filename: mapping.filename });
    } catch (err) {
      emitLog({
        type: 'response_error',
        stage: 'SCADA_API',
        action: `[${ctype}/3] Error downloading ${mapping.filename}`,
        url: targetUrl,
        status: err.response?.status || 500,
        error: err.message,
        acknowledged: false
      });
      results.push({ ctype, success: false, filename: mapping.filename, error: err.message });
    }
  }

  res.json({
    success: results.some(r => r.success),
    results,
    certificates: certificatesStore
  });
});

// 6. Medha Server: Download ZIP from Medha Server
app.post('/api/medha/download-zip', async (req, res) => {
  const { medhaUrl, imei } = req.body;
  const targetUrl = medhaUrl || `https://api.iotscada-pmsg.com/api/SSLCert/downloadzip?imei=${imei || '869366088390823'}`;
  const startTime = Date.now();

  emitLog({
    type: 'request',
    stage: 'MEDHA_SERVER',
    action: 'Initiating ZIP package download from Medha server',
    url: targetUrl,
    method: 'GET'
  });

  try {
    const response = await apiClient.get(targetUrl, { responseType: 'arraybuffer' });
    const duration = Date.now() - startTime;
    const buffer = Buffer.from(response.data);

    // Save ZIP to disk
    const zipPath = path.join(DOWNLOAD_DIR, 'medha_certs.zip');
    fs.writeFileSync(zipPath, buffer);

    emitLog({
      type: 'response_success',
      stage: 'MEDHA_SERVER',
      action: `ZIP downloaded successfully from Medha Server (${buffer.length} bytes)`,
      url: targetUrl,
      status: response.status,
      durationMs: duration,
      sizeBytes: buffer.length,
      headers: response.headers,
      acknowledged: true
    });

    // Auto unzip the downloaded file
    const zip = new AdmZip(buffer);
    const zipEntries = zip.getEntries();
    const extractedFiles = [];

    zipEntries.forEach(entry => {
      if (!entry.isDirectory) {
        const entryName = path.basename(entry.entryName);
        const entryData = entry.getData().toString('utf8');
        const extractedPath = path.join(EXTRACT_DIR, entryName);
        fs.writeFileSync(extractedPath, entryData, 'utf8');

        // Check if maps to our certificates
        if (entryName.toLowerCase().includes('ca') || entryName.toLowerCase().includes('root')) {
          certificatesStore.rootCA = { name: entryName, content: entryData, size: entryData.length, status: 'extracted', url: targetUrl, updated: new Date().toISOString() };
        } else if (entryName.toLowerCase().includes('client') || entryName.toLowerCase().includes('crt')) {
          certificatesStore.clientCert = { name: entryName, content: entryData, size: entryData.length, status: 'extracted', url: targetUrl, updated: new Date().toISOString() };
        } else if (entryName.toLowerCase().includes('key')) {
          certificatesStore.privateKey = { name: entryName, content: entryData, size: entryData.length, status: 'extracted', url: targetUrl, updated: new Date().toISOString() };
        }

        extractedFiles.push({
          name: entryName,
          size: entryData.length,
          preview: entryData.substring(0, 150)
        });
      }
    });

    emitLog({
      type: 'extraction_success',
      stage: 'ZIP_EXTRACTION',
      action: `Extracted ${extractedFiles.length} files from Medha ZIP archive`,
      extractedFiles,
      acknowledged: true
    });

    res.json({
      success: true,
      extractedFiles,
      certificates: certificatesStore
    });
  } catch (err) {
    const duration = Date.now() - startTime;
    emitLog({
      type: 'response_error',
      stage: 'MEDHA_SERVER',
      action: 'Medha Server ZIP download failed',
      url: targetUrl,
      status: err.response?.status || 500,
      durationMs: duration,
      error: err.message,
      acknowledged: false
    });

    res.status(err.response?.status || 500).json({
      success: false,
      error: err.message
    });
  }
});

// 7. Manual ZIP Upload & Extraction (Base64 or Raw)
app.post('/api/zip/extract-manual', (req, res) => {
  const { zipBase64, filename } = req.body;
  if (!zipBase64) {
    return res.status(400).json({ success: false, error: 'No ZIP payload provided' });
  }

  try {
    const buffer = Buffer.from(zipBase64.replace(/^data:.*?;base64,/, ''), 'base64');
    const zip = new AdmZip(buffer);
    const zipEntries = zip.getEntries();
    const extractedFiles = [];

    emitLog({
      type: 'process_start',
      stage: 'ZIP_EXTRACTION',
      action: `Manual ZIP extraction started (${filename || 'uploaded.zip'}, ${buffer.length} bytes)`
    });

    zipEntries.forEach(entry => {
      if (!entry.isDirectory) {
        const entryName = path.basename(entry.entryName);
        const entryData = entry.getData().toString('utf8');
        const extractedPath = path.join(EXTRACT_DIR, entryName);
        fs.writeFileSync(extractedPath, entryData, 'utf8');

        // Identify file
        if (entryName.toLowerCase().includes('ca') || entryName.toLowerCase().includes('root')) {
          certificatesStore.rootCA = { name: entryName, content: entryData, size: entryData.length, status: 'extracted', url: 'manual_zip', updated: new Date().toISOString() };
        } else if (entryName.toLowerCase().includes('client') || entryName.toLowerCase().includes('crt')) {
          certificatesStore.clientCert = { name: entryName, content: entryData, size: entryData.length, status: 'extracted', url: 'manual_zip', updated: new Date().toISOString() };
        } else if (entryName.toLowerCase().includes('key')) {
          certificatesStore.privateKey = { name: entryName, content: entryData, size: entryData.length, status: 'extracted', url: 'manual_zip', updated: new Date().toISOString() };
        } else {
          certificatesStore.additional.push({ name: entryName, size: entryData.length, content: entryData });
        }

        extractedFiles.push({
          name: entryName,
          size: entryData.length,
          preview: entryData.substring(0, 150)
        });
      }
    });

    emitLog({
      type: 'extraction_success',
      stage: 'ZIP_EXTRACTION',
      action: `Extracted ${extractedFiles.length} certificate files successfully from manual ZIP`,
      extractedFiles,
      acknowledged: true
    });

    res.json({
      success: true,
      extractedFiles,
      certificates: certificatesStore
    });
  } catch (err) {
    emitLog({
      type: 'process_error',
      stage: 'ZIP_EXTRACTION',
      action: 'Failed to extract manual ZIP archive',
      error: err.message,
      acknowledged: false
    });

    res.status(500).json({ success: false, error: err.message });
  }
});

// 8. Wireless Transfer to Target Device URL
app.post('/api/wireless/transfer', async (req, res) => {
  const { targetUrl, transferMode = 'json', customHeaders = {}, customPayload } = req.body;

  if (!targetUrl) {
    return res.status(400).json({ success: false, error: 'Wireless Target URL is required' });
  }

  const startTime = Date.now();
  emitLog({
    type: 'wireless_start',
    stage: 'WIRELESS_TRANSFER',
    action: `Initiating Wireless Certificate Transfer to ${targetUrl}`,
    url: targetUrl,
    method: 'POST',
    transferMode
  });

  try {
    let payload;
    let headers = { ...customHeaders };

    if (customPayload) {
      payload = customPayload;
    } else if (transferMode === 'json') {
      headers['Content-Type'] = 'application/json';
      payload = {
        deviceId: 'DEVICE_PROVISION_' + Date.now(),
        certificates: {
          rootCA: certificatesStore.rootCA.content,
          clientCert: certificatesStore.clientCert.content,
          privateKey: certificatesStore.privateKey.content
        },
        metadata: {
          rootCA_name: certificatesStore.rootCA.name,
          clientCert_name: certificatesStore.clientCert.name,
          privateKey_name: certificatesStore.privateKey.name,
          transferredAt: new Date().toISOString()
        }
      };
    } else {
      // plain text combined / bundle format
      payload = `=== ROOT CA ===\n${certificatesStore.rootCA.content}\n\n=== CLIENT CERT ===\n${certificatesStore.clientCert.content}\n\n=== PRIVATE KEY ===\n${certificatesStore.privateKey.content}`;
      headers['Content-Type'] = 'text/plain';
    }

    const response = await apiClient.post(targetUrl, payload, { headers, timeout: 20000 });
    const duration = Date.now() - startTime;

    const ackLog = emitLog({
      type: 'wireless_success',
      stage: 'WIRELESS_TRANSFER',
      action: `Wireless Transfer Acknowledged by Device (${response.status} ${response.statusText})`,
      url: targetUrl,
      status: response.status,
      statusText: response.statusText,
      durationMs: duration,
      headers: response.headers,
      responseBody: response.data,
      acknowledged: true
    });

    res.json({
      success: true,
      acknowledgment: response.data,
      status: response.status,
      log: ackLog
    });
  } catch (err) {
    const duration = Date.now() - startTime;
    const errMsg = err.response ? `Device HTTP ${err.response.status}: ${err.response.statusText}` : err.message;

    emitLog({
      type: 'wireless_error',
      stage: 'WIRELESS_TRANSFER',
      action: `Wireless Transfer Failed to ${targetUrl}`,
      url: targetUrl,
      status: err.response?.status || 'NETWORK_ERROR',
      durationMs: duration,
      error: errMsg,
      responseBody: err.response?.data || null,
      acknowledged: false
    });

    res.status(err.response?.status || 500).json({
      success: false,
      error: errMsg,
      details: err.response?.data || err.message
    });
  }
});

// 9. Manual Certificate Content Update
app.post('/api/certificates/update', (req, res) => {
  const { key, content, name } = req.body;
  if (!certificatesStore[key]) {
    return res.status(400).json({ success: false, error: 'Invalid certificate key' });
  }

  certificatesStore[key] = {
    ...certificatesStore[key],
    name: name || certificatesStore[key].name,
    content: content,
    size: Buffer.byteLength(content, 'utf8'),
    status: content ? 'ready' : 'empty',
    updated: new Date().toISOString()
  };

  emitLog({
    type: 'content_updated',
    stage: 'MANUAL_EDIT',
    action: `Updated certificate content for ${certificatesStore[key].name}`,
    details: { key, size: certificatesStore[key].size }
  });

  res.json({ success: true, certificate: certificatesStore[key] });
});

// 10. Device Simulator / Mock Acknowledgment Endpoint for testing
app.post('/api/mock/device-ack', (req, res) => {
  const receivedData = req.body;
  const certCount = receivedData.certificates ? Object.keys(receivedData.certificates).filter(k => !!receivedData.certificates[k]).length : 0;
  
  res.json({
    status: 'ACK_SUCCESS',
    deviceStatus: 'PROVISIONED',
    deviceId: receivedData.deviceId || 'MOCK_DEVICE_ESP32_01',
    certificatesReceived: certCount,
    keys: receivedData.certificates ? Object.keys(receivedData.certificates) : [],
    timestamp: new Date().toISOString(),
    message: 'All SSL certificates successfully flashed and installed into hardware secure storage over wireless.'
  });
});

// Start Express server
const server = app.listen(PORT, () => {
  console.log(`[Express Backend] Certificate Worker API running on http://localhost:${PORT}`);
});

module.exports = { app, server };
