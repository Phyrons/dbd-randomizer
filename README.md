# 🩸 Blood Hex: DBD Perk Spinner
**An interactive, bilingual perk randomizer for Dead by Daylight integrated with Streamer.bot and OBS.**

![DBD Badge](https://img.shields.io/badge/Game-Dead%20By%20Daylight-red) ![Streamerbot Badge](https://img.shields.io/badge/Integrated-Streamer.bot-purple) ![Language](https://img.shields.io/badge/Language-English%20%2F%20Espa%C3%B1ol-blue)

---

## 🌐 Quick Links / Enlaces Rápidos
* [English Guide](#english-guide)
* [Guía en Español](#guía-en-español)

---

<a name="english-guide"></a>
## 🇺🇸 English Guide

### 🚀 1. Installation & Download
1.  **Download**: Click the green **`<> Code`** button at the top of this page and select **Download ZIP**.
2.  **Extract**: Unzip the folder in your preferred location.
3.  **Import to Streamer.bot**:
    * Open **Streamer.bot**.
    * Click **Import** from the top menu.
    * Drag and drop the file named `SpinnerDBDStreamerBot` into the "Import String" box.
    * Click the **Import** button.

> [!IMPORTANT]  
> You must have your **OBS <-> Streamer.bot** connection already configured before proceeding.

### 🎥 2. OBS Setup
1.  Add a new **Browser Source** to your Scene.
2.  Check the **"Local File"** box.
3.  Click **Browse** and select the `index.html` file from the project folder.
4.  Set **Width** to `1920` and **Height** to `1080`.
5.  Scroll down and click the **"Refresh cache of current page"** button a couple of times.
6.  Keep other settings as default and click **OK**.
7.  Adjust the source on your screen and lock it if desired.

### ⚙️ 3. Linking Actions
1.  In Streamer.bot, go to **Actions & Queues** > **Actions**.
2.  Search for the group **"Spinners"**.
3.  For **each** action (`Spinner DBD Killer`, `Spinner DBD Language`, `Spinner DBD ReRoll`, `Spinner DBD Surv`):
    * The first sub-action is the link to your OBS source.
    * **Double-click it** and re-select your OBS Browser Source to ensure the connection is active.

### ⌨️ 4. Chat Commands
| Command | Description |
| :--- | :--- |
| `!lan es` | Changes perk names and UI to **Spanish**. |
| `!lan eng` | Changes perk names and UI to **English**. |
| `!rollkiller` | Starts the spinner for **Killer** perks. |
| `!rollsurv` | Starts the spinner for **Survivor** perks. |
| `!reroll [number]` | Rerolls a specific slot (e.g., `!reroll 3` will spin the 3rd slot again). |

*Note: The **Spinner Chat Log** action sends automatic messages to chat. You can disable this action if you prefer.*

### 🔍 5. Perk Filters (Character Bans)
1.  In OBS, right-click your "Spinner DBD" browser source and select **Interact**.
2.  Click on **"SURVIVOR"** or **"KILLER"** to choose a category.
3.  Click the **"FILTERS"** button.
4.  Select the characters you want to ban (they will turn **red**).
5.  Click **SAVE** and you are ready to go!

---

<a name="guía-en-español"></a>
## 🇲🇽 Guía en Español

### 🚀 1. Descarga e Instalación
1.  **Descarga**: Presiona el botón verde **`<> Code`** arriba a la derecha y selecciona **Download ZIP**.
2.  **Descomprimir**: Extrae la carpeta en la ubicación de tu PC que prefieras.
3.  **Importar a Streamer.bot**:
    * Abre **Streamer.bot**.
    * Selecciona la opción **Import** del menú superior.
    * Arrastra el archivo llamado `SpinnerDBDStreamerBot` al cuadro gris de "Import String".
    * Presiona el botón **Import**.

> [!IMPORTANT]  
> Es necesario que ya tengas configurada la conexión entre **Streamer.bot y OBS** para que funcione.

### 🎥 2. Configuración en OBS
1.  Agrega una nueva **Fuente de Navegador** a tu Escena.
2.  Marca la casilla **"Archivo Local"**.
3.  Presiona **Examinar** y selecciona el archivo `index.html` de la carpeta descargada.
4.  En **Ancho** pon `1920` y en **Alto** `1080`.
5.  Hasta abajo, presiona un par de veces el botón **"Actualizar la caché de la página actual"**.
6.  Presiona **Aceptar**, ajusta la fuente a tu gusto en pantalla y bloquéala.

### ⚙️ 3. Vincular Acciones
1.  En Streamer.bot, ve a **Actions & Queues** > **Actions**.
2.  Busca el grupo **"Spinners"**.
3.  En **cada** una de las acciones (`Spinner DBD Killer`, `Spinner DBD Language`, `Spinner DBD ReRoll`, `Spinner DBD Surv`):
    * La primera sub-acción es el vínculo con tu OBS.
    * Dale **doble click** y vuelve a seleccionar tu fuente de OBS para asegurar que estén vinculados correctamente.

### ⌨️ 4. Comandos del Chat
| Comando | Descripción |
| :--- | :--- |
| `!lan es` | Cambia el idioma de las perks a **Español**. |
| `!lan eng` | Cambia el idioma de las perks a **Inglés**. |
| `!rollkiller` | Inicia la ruleta con perks de **Asesino**. |
| `!rollsurv` | Inicia la ruleta con perks de **Superviviente**. |
| `!reroll [núm]` | Gira de nuevo un slot específico (Ej: `!reroll 3` cambiará la 3ra perk). |

*Nota: La acción **Spinner Chat Log** envía mensajes automáticos al chat; puedes desactivarla si lo prefieres.*

### 🔍 5. Filtros de Perks (Banear Personajes)
1.  En OBS, haz clic derecho en la fuente "Spinner DBD" y selecciona **Interactuar**.
2.  Haz clic en **"SURVIVOR"** o **"KILLER"** para elegir la categoría.
3.  Presiona el botón **"FILTERS"**.
4.  Selecciona los personajes que no quieres que aparezcan (se pondrán en **rojo**).
5.  Presiona **SAVE** y listo.

---
**Developed with ❤️ for LunarPrincess29.**
**Thank you so much, LunarPrincess29, for all your love and support. This app is dedicated 100% to you ❤️**
**https://www.twitch.tv/lunarprincess29**
