import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Home from './pages/Home';
import Biblioteca from './pages/Biblioteca';
import LivroDetalhe from './pages/LivroDetalhe';

export default function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <Header />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/biblioteca" element={<Biblioteca />} />
          <Route path="/livro/:categoryId" element={<LivroDetalhe />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
