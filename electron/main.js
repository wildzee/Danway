const { app, BrowserWindow, dialog } = require('electron');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const http = require('http');

const isDev = process.env.NODE_ENV === 'development';
const PORT = parseInt(process.env.ELECTRON_PORT || '3131', 10);

let mainWindow;
let nextServer;

// ──────────────────────────────────────────────
// 1. Locate and prepare the SQLite database file
// ──────────────────────────────────────────────
function prepareDatabasePath() {
    const userDataPath = app.getPath('userData');

    // Ensure the userData directory exists
    if (!fs.existsSync(userDataPath)) {
        fs.mkdirSync(userDataPath, { recursive: true });
    }

    const dbPath = path.join(userDataPath, 'danway.db');

    // If no database exists yet, copy the bundled template database
    if (!fs.existsSync(dbPath)) {
        const templatePath = isDev
            ? path.join(__dirname, '..', 'prisma', 'prisma', 'dev.db')
            : path.join(process.resourcesPath, 'prisma', 'dev.db');

        if (fs.existsSync(templatePath)) {
            fs.copyFileSync(templatePath, dbPath);
            console.log(`[DB] Copied template database to: ${dbPath}`);
        } else {
            console.log(`[DB] No template database found, creating empty database.`);
        }
    }

    // Inject this into the environment so Prisma picks it up
    process.env.DATABASE_URL = `file:${dbPath}`;
    console.log(`[DB] Using database at: ${dbPath}`);
}

// ──────────────────────────────────────────────
// 2. Wait for server to be ready
// ──────────────────────────────────────────────
function waitForServer(url, retries = 30) {
    return new Promise((resolve, reject) => {
        let attempts = 0;
        const check = () => {
            attempts++;
            http.get(url, (res) => {
                resolve();
            }).on('error', () => {
                if (attempts >= retries) {
                    reject(new Error(`Server did not start after ${retries} attempts.`));
                } else {
                    setTimeout(check, 1000);
                }
            });
        };
        check();
    });
}

// ──────────────────────────────────────────────
// 3. Boot the Next.js server inside the main process
// ──────────────────────────────────────────────
function startNextServer() {
    return new Promise((resolve, reject) => {
        // In dev: .../DanwayEME/server.js
        // In prod: .../app.asar/server.js (__dirname is .../app.asar/electron)
        const serverScript = path.join(__dirname, '..', 'server.js');

        // Setting environment variables for the intrinsically loaded server
        process.env.PORT = String(PORT);
        if (!isDev) {
            process.env.NODE_ENV = 'production';
        }

        try {
            // Because Electron Main Process patches 'fs' to read inside .asar natively, 
            // Next.js will boot flawlessly right from the archive!
            require(serverScript);
            
            // Wait for it to become ready via HTTP polling
            waitForServer(`http://127.0.0.1:${PORT}`, 30)
                .then(resolve)
                .catch(reject);
        } catch (err) {
            console.error('[Next.js] Failed to require internal server process:', err);
            reject(err);
        }
    });
}

// ──────────────────────────────────────────────
// 4. Create the main browser window
// ──────────────────────────────────────────────
function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        minWidth: 1100,
        minHeight: 700,
        title: 'Danway EME',
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
        },
        // Show icon on Mac/Windows after build
        // icon: path.join(__dirname, 'icon.png'),
        backgroundColor: '#09090b',
    });

    mainWindow.loadURL(`http://127.0.0.1:${PORT}`);

    if (isDev) {
        mainWindow.webContents.openDevTools();
    }

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

// ──────────────────────────────────────────────
// 5. App lifecycle
// ──────────────────────────────────────────────
app.whenReady().then(async () => {
    try {
        prepareDatabasePath();
        await startNextServer();
        createWindow();
    } catch (err) {
        console.error('Failed to start Danway EME:', err);
        dialog.showErrorBox(
            'Startup Error',
            `Danway EME could not start.\n\n${err.message}`
        );
        app.quit();
    }
});

app.on('window-all-closed', () => {
    if (nextServer) {
        nextServer.kill();
    }
    app.quit();
});

app.on('activate', () => {
    if (mainWindow === null) {
        createWindow();
    }
});
