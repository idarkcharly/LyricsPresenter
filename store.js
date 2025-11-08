// store.js
// Este archivo es un utilitario simple para guardar y leer datos en formato JSON desde disco.
// Sirve para que la app recuerde las canciones y configuraciones aunque la cierres.

const fs = require("fs");
const path = require("path");

class Store {
    constructor(folder, filename = "data.json") {
        this.path = path.join(folder);
        this.file = path.join(this.path, filename);
        try {
            if (!fs.existsSync(this.path)) fs.mkdirSync(this.path, { recursive: true });
            if (!fs.existsSync(this.file)) fs.writeFileSync(this.file, JSON.stringify([]));
        } catch (e) {
            console.error("Error al inicializar Store", e);
        }
    }

    get() {
        try {
            const raw = fs.readFileSync(this.file, "utf8");
            return JSON.parse(raw || "[]");
        } catch (e) {
            return [];
        }
    }

    set(data) {
        try {
            fs.writeFileSync(this.file, JSON.stringify(data, null, 2));
            return true;
        } catch (e) {
            console.error("Error al guardar datos en Store", e);
            return false;
        }
    }

    async exportTo(targetPath, data) {
        return fs.promises.writeFile(targetPath, JSON.stringify(data, null, 2), "utf8");
    }
}

module.exports = Store;
