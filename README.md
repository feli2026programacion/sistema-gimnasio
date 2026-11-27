este es del tp1
# Sistema de Gestión para Gimnasio (RT BURPERS Y GYM LUCIA)

## Integrantes
- Cruz Felicidad
- Calpanchay Sonia
- Joaquin Torrez
- Cansino Fabricio
- Katrina Gonzalez


# Descripción del Sistema
Este es nuestro trabajo práctico para la materia. Hicimos una aplicación web en React y Vite para la página de un gimnasio. Nos organizamos dividiendo todo en componentes (`Navbar`, `Footer`, `MainContent` y `Tarjeta`), y para darle estilo usamos CSS Modules y variables globales para que quede bien ordenado y adaptable

## Captura de la Página Funcionando
![Captura de la página](./public/image.png)

## Comandos para Levantar el Proyecto

Sigue estos pasos para clonar y ejecutar el proyecto localmente:

1. Clonar el repositorio:
   ```bash
   git clone https://github.com/feli2026programacion/sistema-gimnasio.git





## Esto es del proyecto final
# Sistema de Gestión de Gimnasio (MVP)

Aplicación web desarrollada en **React** con **Firebase Authentication** y **Cloud Firestore** para centralizar la administración diaria de un gimnasio: socios, planes, caja, cuotas y control de asistencias.

## Funcionalidades principales
- **Autenticación y rutas protegidas:** inicio de sesión y registro con Firebase Auth, acceso restringido a vistas internas mediante `ProtectedRoute` y navegación desde `DashboardLayout`.
- **Gestión de Clientes (`ClientesPage`):** alta, edición, búsqueda y baja de socios con DNI normalizado como `string` y estado (`Activo` / `Inactivo`) regido por reglas de negocio.
- **Gestión de Planes (`PlanesPage`):** administración compartida de planes (nombre, precio, duración en días y cantidad de clases) entre usuarios autenticados.
- **Cuotas y Caja:** control de apertura/cierre de caja previo al registro de cuotas y actualización de vigencia o clases del socio.
- **Asistencias (`Asistencias`):** validación por DNI (existencia, estado activo, cuota vigente y límite de una asistencia por día), descuento automático de clases y registro del historial.

## Tecnologías y librerías utilizadas
- React
- React Router (`react-router-dom`)
- React Hook Form (`react-hook-form`)
- Firebase Authentication & Cloud Firestore (`firebase`)

## Ejecución en local

1. **Clonar el repositorio:**
   ```bash
   git clone -b joaquin https://github.com/feli2026programacion/sistema-gimnasio.git

   cd sistema-gimnasio

## instalar dependencias
npm install
npm install firebase react-router-dom react-hook-form