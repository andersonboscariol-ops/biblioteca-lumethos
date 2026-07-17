import { motion } from 'framer-motion'
import HeroBanner from '../../components/herobanner/HeroBanner'
import CategoryGrid from '../../components/categories/CategoryGrid'
import { ContinueStudying } from '../../components/carousel/Carousel'
import BookCarousel from '../../components/carousel/Carousel'
import RightPanel from '../../components/rightpanel/RightPanel'
import { books, continueStudying } from '../../data/catalog'

export default function Home() {
  const topBooks = [...books].sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 10)

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1fr_280px] gap-5">
      <div className="space-y-5 min-w-0">
        <HeroBanner />

        {continueStudying?.length > 0 && (
          <ContinueStudying books={continueStudying} />
        )}

        <BookCarousel title="Destaques" books={topBooks} />

        <CategoryGrid />
      </div>

      <div className="hidden xl:block">
        <div className="sticky top-[76px]">
          <RightPanel />
        </div>
      </div>
    </div>
  )
}
