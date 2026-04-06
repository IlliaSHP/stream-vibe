import '@styles/index.scss'
import Header from '@/widgets/Header/ui/Header'
import Footer from '@/widgets/footer/Footer'
import HeroSection from '@/widgets/HeroSection'

function App() {

  return (
    <>
      <Header />
      <main>
        {/*<AppRouter />*/}
        <HeroSection />

      </main>
      <Footer />
    </>
  )
}

export default App
