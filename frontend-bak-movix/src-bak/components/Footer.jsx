import { BookOpen } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <BookOpen size={24} color="#C79A2E" />
          <span>Instituto Lumethos</span>
        </div>
        <p className="footer-text">
          Biblioteca Teológica — Todos os direitos reservados.
          Conteúdo licenciado para uso exclusivo do Instituto Lumethos.
        </p>
        <p className="footer-small">© {new Date().getFullYear()} Instituto Lumethos</p>
      </div>
    </footer>
  );
}
