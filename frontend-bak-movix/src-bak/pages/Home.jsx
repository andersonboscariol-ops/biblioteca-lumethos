import HeroSection from '../components/HeroSection';
import CategoriaSection from '../components/CategoriaSection';
import Footer from '../components/Footer';
import { categories } from '../data/catalog';

export default function Home() {
  const featured = categories.slice(0, 6);

  return (
    <>
      <HeroSection />
      <main className="main-content">
        <div className="section-header centered">
          <h2 className="section-title">Explore por Categoria</h2>
          <p className="section-desc">Navegue pelas principais áreas do conhecimento teológico</p>
        </div>
        {featured.map((cat, i) => (
          <CategoriaSection key={cat.id} category={cat} index={i} />
        ))}
      </main>
      <Footer />
    </>
  );
}
