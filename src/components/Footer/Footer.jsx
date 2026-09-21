import estilos from './Footer.module.css';

function Footer() {
  return (
    <footer className={estilos.pie}>
      <p>Sistema de Gestión de Gimnasios – Práctica Profesional 2</p>
      <p>Equipo: Calpanchay, Cansino, Cruz, Gonzalez y Torrez</p>
      <p>Instituto Superior Del Milagro N.º 8207 – 2026</p>
    </footer>
  );
}

export default Footer;