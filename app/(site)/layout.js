import Nav from '@/components/layout/Nav'
import Footer from '@/components/layout/Footer'

export default function SiteLayout({ children }) {
  return (
    <>
      <Nav />
      <main>{children}</main>
      <Footer />
    </>
  )
}
