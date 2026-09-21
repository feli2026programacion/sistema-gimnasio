import estilos from './Navbar.module.css';

function Navbar() {
  return (
    <header className={estilos.barra}>
      <img src="/Logo.png" alt="Logo del sistema" className={estilos.logo} /> 
      <h1 className={estilos.titulo}>Gimnasios RT Burpers y El Gym Lucía</h1>
      <nav className={estilos.menu}>
        <a href="#">Inicio</a>
        <a href="#">Módulos</a>
        <a href="#">Equipo</a>
      </nav>
    </header>
  );
}

export default Navbar;
