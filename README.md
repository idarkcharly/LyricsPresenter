# 🎤 Lyrics Presenter

**Lyrics Presenter** es una aplicación creada con **Electron** para **editar, controlar y proyectar letras** en vivo.  
Incluye un **panel de control** y una **ventana de proyección.**

---

## ✨ Características

- 📝 **Editor de letras** con procesamiento línea por línea.  
- 🖥️ **Proyección en monitor secundario**, con fondo de **imagen o video**.  
- 🌈 **Animaciones opcionales** y ajuste dinámico del **tamaño de fuente**.  
- 📂 **Importar y exportar** biblioteca en formato **JSON** o **texto plano**.  
- ⚙️ **Interfaz moderna**, oscura y minimalista.

---

## ⚡ Requisitos

- **Node.js** ≥ 18  
- **npm** (incluido con Node.js)  

---

## 🚀 Cómo ejecutar el proyecto

### 1. Clonar el repositorio
```bash
git clone https://github.com/idarkcharly/LyricsPresenter.git
cd LyricsPresenter
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Ejecutar en modo desarrollo
```bash
npm start
```

## 🧩 Fuentes y assets

- `projection.html` referencia `./fonts/Montserrat-ExtraBold.ttf`. Si usas esa fuente, coloca el archivo .ttf en la carpeta `fonts/` antes de ejecutar o empaquetar.  
- Si prefieres usar fuentes del sistema, modifica `projection.html` para eliminar la @font-face.

---

### 4. Generar ejecutable (Windows x64 — sin instalador)

Desde PowerShell (raíz del proyecto):

Con icono (opcional, coloca `app.ico` en la raíz):
```powershell
npx electron-packager . "Lyrics Presenter" --platform=win32 --arch=x64 --overwrite --out=release --no-asar --icon=app.ico
```

Sin icono:
```powershell
npx electron-packager . "Lyrics Presenter" --platform=win32 --arch=x64 --overwrite --out=release --no-asar
```

Salida esperada:
```
release/
└── Lyrics Presenter-win32-x64/
    ├── Lyrics Presenter.exe
    ├── resources/
    ├── locales/
    └── (otros archivos requeridos)
```
---
## 📦 Formato de la biblioteca (JSON)

Para importar/exportar canciones se espera un array de objetos con `"titulo"` y `"letra"` (array de líneas). El símbolo `§` puede usarse para salto manual dentro de una línea.

Ejemplo:
```json
[
  {
    "titulo": "Canción de ejemplo",
    "letra": [
      "Primera línea",
      "Segunda línea§con salto",
      "Tercera línea"
    ]
  }
]
```

---

## 📄 Licencia

MIT
