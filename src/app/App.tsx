import { useEffect } from 'react'
import { BrowserRouter, Link, Route, Routes, useLocation } from 'react-router'

import { Footer } from './components/Footer'
import { Nav } from './components/Nav'
import { Board } from './pages/Board'
import { Employers } from './pages/Employers'
import { JobDetail } from './pages/JobDetail'
import { Method } from './pages/Method'

function ScrollManager() {
  const { pathname, hash } = useLocation()

  useEffect(() => {
    if (hash) {
      const target = document.querySelector(hash)
      if (target) {
        window.setTimeout(() => target.scrollIntoView({ behavior: 'smooth' }), 40)
        return
      }
    }
    window.scrollTo({ top: 0 })
  }, [pathname, hash])

  return null
}

function NotFound() {
  return (
    <div className="mx-auto max-w-[900px] px-5 py-28 sm:px-8">
      <p className="text-[12px] tracking-[0.16em] text-faint uppercase">404</p>
      <h1 className="font-display mt-4 text-[clamp(36px,6vw,64px)]">That page isn’t here.</h1>
      <p className="mt-4 max-w-[44ch] text-[15px] leading-relaxed text-muted">
        The board, the method and the employer page all exist. This link does not.
      </p>
      <Link to="/" className="mt-8 inline-flex h-11 items-center rounded-full bg-fg px-5 text-[14px] font-medium text-bg">
        Go to the board
      </Link>
    </div>
  )
}

export function App() {
  return (
    <BrowserRouter>
      <ScrollManager />
      <Nav />
      <main>
        <Routes>
          <Route index element={<Board />} />
          <Route path="job/:id" element={<JobDetail />} />
          <Route path="employers" element={<Employers />} />
          <Route path="how-it-works" element={<Method />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </BrowserRouter>
  )
}
