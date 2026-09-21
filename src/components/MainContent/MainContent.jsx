import Tarjeta from '../Tarjeta/Tarjeta';
import estilos from './MainContent.module.css';

function MainContent() {
  return (
    <main className={estilos.contenido}>
      <section className={estilos.intro}>
        <h1 className={estilos.mainTitle}>Sistema de Gestión de Gimnasios RT Bumpers y El Gym Lucía</h1>
        
        <h2>¿Qué es?</h2>
        <p>
          Es un sistema informático desarrollado para gestionar y organizar las actividades 
          administrativas y operativas de las dos sedes del gimnasio RT Bumpers y Gym Lucía.
        </p>
        
        <h2>¿Para qué sirve?</h2>
        <p>
          El sistema sirve para llevar un control centralizado de los clientes, asistencias, cuotas, 
          deudas, ventas y productos, permitiendo organizar la información de las dos sedes y reducir 
          los problemas que pueden generarse al utilizar registros manuales.
        </p>
      </section>

      <section className={estilos.modulesSection}>
        <h2>Módulos principales del sistema</h2>
        <div className={estilos.modulos}>
          <Tarjeta 
            titulo="Clientes y asistencias" 
            descripcion="Permite registrar los datos de los clientes y controlar sus asistencias al gimnasio." 
            estado="Activo"
            principal={true} 
          />
          <Tarjeta 
            titulo="Cuotas y deudas" 
            descripcion="Permite registrar las cuotas de los clientes y controlar los pagos pendientes y las deudas." 
            estado="Pendiente" 
          />
          <Tarjeta 
            titulo="Ventas" 
            descripcion="Permite registrar las ventas realizadas y sus respectivos detalles." 
            estado="Activo" 
          />
        </div>
      </section>
    </main>
  );
}

export default MainContent;