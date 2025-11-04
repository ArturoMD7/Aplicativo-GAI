# 🧠 APLICATIVO GAI (Proyecto Fullstack)
Este es un proyecto fullstack que implementa un sistema de autenticación (Login y Registro) y sirve como base para el "Aplicativo GAI". La arquitectura está desacoplada:
backend/: Una API REST construida con Django y Django Rest Framework.
frontend/: Una aplicación de una sola página (SPA) construida con React, Vite y TypeScript.

🚀 Requisitos Previos
Antes de comenzar, asegúrate de tener instalado:
- Python 3.10+
- Node.js 18+ (que incluye npm)
- Un servidor SQL Server accesible (local o en la nube).
- Controlador ODBC 17 para SQL Server (requerido por mssql-django).

⚙️ 1. Configuración del Backend (Django)
Sigue estos pasos desde la carpeta raíz del proyecto (APLICATIVO GAI/).

1️⃣ Navegar y crear entorno virtual
cd backend
python -m venv venv

2️⃣ Activar el entorno
En Windows (CMD/PowerShell):
.\venv\Scripts\activate
En macOS/Linux:
source venv/bin/activate

3️⃣ Instalar dependencias
Usamos el archivo requirements.txt que ya creaste.
pip install -r requirements.txt

4️⃣ Configurar variables de entorno
Crea un archivo llamado .env dentro de la carpeta backend/. Copia y pega el siguiente contenido, ajustando los valores a tu configuración local:
SECRET_KEY=tu-clave-secreta-aqui
DEBUG=True
DB_ENGINE=mssql
DB_NAME=GAI
DB_HOST=ArturoMtz\MSSQLSERVER2
DB_TRUSTED_CONNECTION=yes

5️⃣ Aplicar migraciones
python manage.py migrate

⚛️ 2. Configuración del Frontend (React)
Estos pasos se realizan en una terminal separada.

1️⃣ Navegar e instalar dependencias
cd frontend
npm install

2️⃣ Configurar variables de entorno
Crea un archivo llamado .env dentro de la carpeta frontend/. Este archivo le dirá a React dónde encontrar tu API de Django.
VITE_API_BASE_URL=http://127.0.0.1:8000

▶️ 3. Ejecución del Proyecto
Necesitas dos terminales abiertas para correr el proyecto completo.

Terminal 1: Iniciar Backend
python manage.py runserver
Tu API de Django estará corriendo en http://127.0.0.1:8000.

Terminal 2: Iniciar Frontend
npm run dev
Tu aplicación de React estará disponible en http://localhost:5173 (o el puerto que Vite te indique).

✅ ¡Ahora puedes abrir http://localhost:5173 en tu navegador y probar el login y registro!
