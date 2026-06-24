import '../styles/globals.css';
import type { AppProps } from 'next/app';
import Header from '@/components/Header';
import Navigation from '@/components/Navigation';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <div className="app-container">
      <Header />
      <Navigation />
      <main className="main-content">
        <Component {...pageProps} />
      </main>
      <footer className="footer">
        <p>© 2026 Coreset Camera Calibration Project | יגאל קריגל</p>
        <p>South Lebanon Map Security Intelligence</p>
      </footer>
    </div>
  );
}
