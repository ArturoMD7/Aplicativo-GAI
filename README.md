APLICATIVO GAI (Proyecto Fullstack)
Este es un proyecto fullstack que implementa un sistema de autenticación (Login y Registro) y sirve como base para el "Aplicativo GAI".

La arquitectura está desacoplada:

backend/: Una API REST construida con Django y Django Rest Framework.

frontend/: Una aplicación de una sola página (SPA) construida con React, Vite y TypeScript.

🚀 Requisitos Previos
Antes de comenzar, asegúrate de tener instalado:

Python 3.10+

Node.js 18+ (que incluye npm)

Un servidor SQL Server accesible (local o en la nube).

Controlador ODBC 17 para SQL Server (requerido por mssql-django).

⚙️ 1. Configuración del Backend (Django)
Sigue estos pasos desde la carpeta raíz del proyecto (APLICATIVO GAI/).

1. Navegar y crear entorno virtual
Bash

cd backend
python -m venv venv
2. Activar el entorno
En Windows (CMD/PowerShell):

Bash

.\venv\Scripts\activate
En macOS/Linux:

Bash

source venv/bin/activate
3. Instalar dependencias
Usamos el archivo requirements.txt que ya creaste.

Bash

pip install -r requirements.txt
4. Configurar variables de entorno
Crea un archivo llamado .env dentro de la carpeta backend/. Copia y pega el siguiente contenido, ajustando los valores a tu configuración local:

backend/.env

Ini, TOML

# Clave secreta de Django (puedes generar una nueva)
SECRET_KEY=tu-clave-secreta-aqui

# Modo Debug (True en desarrollo, False en producción)
DEBUG=True

# --- Configuración de Base de Datos (SQL Server) ---
# (Basado en tu configuración de 'trusted_connection')
DB_ENGINE=mssql
DB_NAME=GAI
DB_HOST=ArturoMtz\MSSQLSERVER2
DB_TRUSTED_CONNECTION=yes
5. Aplicar migraciones
Esto creará las tablas en tu base de datos (incluyendo las tablas de usuarios).

Bash

python manage.py migrate
⚛️ 2. Configuración del Frontend (React)
Estos pasos se realizan en una terminal separada.

1. Navegar e instalar dependencias
Bash

cd frontend
npm install
2. Configurar variables de entorno
Crea un archivo llamado .env dentro de la carpeta frontend/. Este archivo le dirá a React dónde encontrar tu API de Django.

frontend/.env

Ini, TOML

# La URL donde corre tu servidor de Django
VITE_API_BASE_URL=http://127.0.0.1:8000
▶️ 3. Ejecución del Proyecto
Necesitas dos terminales abiertas para correr el proyecto completo.

Terminal 1: Iniciar Backend
Bash

# Asegúrate de estar en la carpeta 'backend'
# Asegúrate de que tu entorno virtual (venv) esté activado
python manage.py runserver
Tu API de Django estará corriendo en http://127.0.0.1:8000.

Terminal 2: Iniciar Frontend
Bash

# Asegúrate de estar en la carpeta 'frontend'
npm run dev
Tu aplicación de React estará disponible en http://localhost:5173 (o el puerto que Vite te indique).

¡Ahora puedes abrir http://localhost:5173 en tu navegador y probar el login y registro!
