import styles from './Navbar.module.css';

export function Navbar() {
  return (
    <header className={styles.navbar}>
      <div className={styles.logoContainer}>
        <img src="/Logo.png" alt="Logo RT Bumpers y Gym Lucía" className={styles.logo} />
        <h1 className={styles.title}>Gimnasios RT Bumpers & Gym Lucía</h1>
      </div>
    </header>
  );
}
