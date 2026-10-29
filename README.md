# Postman URL & Certificate Provisioner (Electron + MERN/Vite)

A high-performance desktop and web application designed for automated SSL/TLS certificate acquisition and wireless IoT device provisioning, inspired by Postman.

## 🚀 Key Features

### 1. Left Panel: Certificate Acquisition & Wireless Dispatch Pipeline
- **Certificate Acquisition List (Step 1)**:
  - **Root CA (`rootCA.pem`)**: `ctype=1`
    - `https://api.iotscada-pmsg.com/api/SSLCert/certdownload?imei=869366088390823&user=869366088390823&pass=d47db17&ctype=1&PROJCD=re`
  - **Client Certificate (`client.pem`)**: `ctype=2`
    - `https://api.iotscada-pmsg.com/api/SSLCert/certdownload?imei=869366088390823&user=869366088390823&pass=d47db17&ctype=2&PROJCD=re`
  - **Private Key (`key.pem`)**: `ctype=3`
    - `https://api.iotscada-pmsg.com/api/SSLCert/certdownload?imei=869366088390823&user=869366088390823&pass=d47db17&ctype=3&PROJCD=re`
  - Individual & Batch 1-Click Download actions.
  - Interactive parameter configurator (`IMEI`, `USER`, `PASS`, `PROJCD`).
- **1st. Medha Server ZIP Downloader**:
  - Connects to Medha server to download complete certificate ZIP packages automatically.
- **2nd. Manual ZIP Archive Unpack (4 Files)**:
  - Drag-and-drop or file picker to upload any certificate `.zip` package.
  - Automatically unzips and categorizes `rootCA.pem`, `client.pem`, `key.pem`, and configuration files.
- **Wireless Transfer Destination (Step 2 - Below Certificates)**:
  - Configurable device target endpoint (e.g. `http://192.168.4.1/upload_cert` or IoT gateway).
  - Presets for local Access Points, Gateways, and Mock Device simulator.
  - Flexible payload delivery (Structured JSON bundle or Concatenated PEM bundle).

### 2. Right Panel: Real-Time Acknowledgment & Process Monitor
- **Live Acknowledgment Feed**:
  - Real-time SSE (Server-Sent Events) live log stream capturing every single HTTP request and response.
  - Method badges (`GET`, `POST`), HTTP Status codes (`200 OK`, `400+`), latency (`durationMs`), payload size.
  - Filter by stage: `SCADA_API`, `MEDHA_SERVER`, `ZIP_EXTRACTION`, `WIRELESS_TRANSFER`, `ERRORS`.
- **Response Inspector**:
  - Detailed Postman-like breakdown of selected requests: status codes, response headers, and acknowledgment payload preview.
  - One-click copy for URLs and response JSON.
- **Certificate Vault**:
  - Inspection cards for all 3 certificates with size, status, and raw PEM syntax preview.
- **Certificate Modal**:
  - Fullscreen view, edit, copy to clipboard, and local `.pem` export.

---

## 🛠️ Architecture & Tech Stack

- **Electron**: Native desktop runtime with IPC bridge and system integration.
- **Frontend**: Vite + React 18 + Lucide Icons + Pure CSS Postman dark theme.
- **Backend**: Embedded Node.js / Express server on port `5055`:
  - Axios with custom HTTPS Agent (`rejectUnauthorized: false` for IoT hardware).
  - Adm-Zip for in-memory and disk archive extraction.
  - SSE real-time log emitter.
  - Local mock device acknowledgment endpoint for hardware simulation.

---

## 🏃 Running the Application

### 1. Run in Electron (Desktop App)
```bash
npm run dev
# Or if built:
npm start
```

### 2. Run in Web Browser
```bash
npm run start:web
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 3. Build Production Bundle
```bash
npm run build
```
