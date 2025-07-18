const DB_NAME = 'ScreenshotDB';
const STORE_NAME = 'captures';
let db;

function openDB() {
    return new Promise((resolve, reject) => {
        if (db) return resolve(db);
        const request = indexedDB.open(DB_NAME, 1);
        request.onupgradeneeded = e => {
            e.target.result.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
        };
        request.onsuccess = e => {
            db = e.target.result;
            resolve(db);
        };
        request.onerror = e => reject('Error opening database');
    });
}

async function addCapture(captureData) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.add(captureData);
        req.onsuccess = e => resolve(e.target.result);
        req.onerror = e => reject('Error adding capture');
    });
}

async function getCapture(id) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.get(id);
        req.onsuccess = e => resolve(e.target.result);
        req.onerror = e => reject('Error getting capture');
    });
}

async function getAllCaptures() {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.getAll();
        req.onsuccess = e => resolve(e.target.result);
        req.onerror = e => reject('Error getting all captures');
    });
}

async function deleteCapture(id) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.delete(id);
        req.onsuccess = () => resolve();
        req.onerror = () => reject('Error deleting capture');
    });
}