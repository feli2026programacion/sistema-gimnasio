import styles from './MainContent.module.css';

export function MainContent() {
  const modulos = [
    {
      nombre: 'Clientes y asistencias',
      descripcion: 'Permite registrar los datos de los clientes y controlar sus asistencias al gimnasio.'
    },
    {
      nombre: 'Cuotas y deudas',
      descripcion: 'Permite registrar las cuotas de los clientes y controlar los pagos pendientes y las deudas.'
    },
    {
      nombre: 'Ventas',
      descripcion: 'Permite registrar las ventas realizadas y sus respectivos detalles.'
    },
    {
      nombre: 'Productos y stock',
      descripcion: 'Permite administrar los productos disponibles y controlar los productos correspondientes a cada sede.'
    },
    {
      nombre: 'Proveedores',
      descripcion: 'Permite registrar y relacionar los proveedores con los productos.'
    },
    {
      nombre: 'Sedes',
      descripcion: 'Permite organizar la información de las diferentes sedes del gimnasio.'
    },
    {
      nombre: 'Planes',
      descripcion: 'Permite administrar los planes que ofrece el gimnasio y relacionarlos con las cuotas de los clientes.'
    },
    {
      nombre: 'Horarios',
      descripcion: 'Permite gestionar los horarios y la relación de los horarios con los usuarios.'
    },
    {
      nombre: 'Usuarios y permisos',
      descripcion: 'Permite administrar los usuarios del sistema, sus perfiles y los permisos que tendrá cada uno.'
    }
  ];

  return (
    <main className={styles.container}>
      <section className={styles.intro}>
        <h1 className={styles.mainTitle}>Sistema de Gestión de Gimnasios RT Bumpers y Gym Lucía</h1>
        
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

      <section className={styles.modulesSection}>
        <h2>Módulos principales del sistema</h2>
        <div className={styles.grid}>
          {modulos.map((mod, index) => (
            <div key={index} className={styles.card}>
              <h3>{mod.nombre}</h3>
              <p>{mod.descripcion}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}