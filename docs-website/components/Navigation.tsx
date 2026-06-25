import Link from 'next/link';
import { useRouter } from 'next/router';

export default function Navigation() {
  const router = useRouter();

  const isActive = (path: string) => router.pathname === path;

  return (
    <nav className="navigation">
      <div className="nav-container">
        <Link href="/" className={`nav-link ${isActive('/') ? 'active' : ''}`}>
          🏠 Home
        </Link>
        <Link href="/goals" className={`nav-link ${isActive('/goals') ? 'active' : ''}`}>
          🎯 Goals
        </Link>
        <Link href="/overview" className={`nav-link ${isActive('/overview') ? 'active' : ''}`}>
          📖 Overview
        </Link>
        <Link href="/algorithms" className={`nav-link ${isActive('/algorithms') ? 'active' : ''}`}>
          🧮 Algorithms
        </Link>
        <Link href="/testing" className={`nav-link ${isActive('/testing') ? 'active' : ''}`}>
          ✅ Testing
        </Link>
        <Link href="/timeline" className={`nav-link ${isActive('/timeline') ? 'active' : ''}`}>
          📅 Timeline
        </Link>
        <Link href="/phase2" className={`nav-link ${isActive('/phase2') ? 'active' : ''}`}>
          📷 Phase 2
        </Link>
        <Link href="/navigation-features" className={`nav-link ${isActive('/navigation-features') ? 'active' : ''}`}>
          🧭 Navigation
        </Link>
        <a
          href="https://github.com/ikrigel/south-lebanon-map"
          target="_blank"
          rel="noopener noreferrer"
          className="nav-link external"
        >
          🔗 GitHub
        </a>
      </div>
    </nav>
  );
}
