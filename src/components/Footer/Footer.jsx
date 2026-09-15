import styles from './Footer.module.css';

export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.content}>
        <p><strong>Instituto:</strong> Instituto Superior Del Milagro</p>
        <p><strong>Carrera:</strong> Tecnicatura Superior en Análisis de Sistemas Informáticos</p>
        <p>
          <strong>Equipo:</strong> Cansino Fabricio, Sonia Calpanchay, Cruz Felicidad, Joaquín Torres, Katrina González
        </p>
      </div>
    </footer>
  );
}