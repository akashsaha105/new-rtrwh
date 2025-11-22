import React from 'react'
import Navbar from '@/components/Navbar'
import Hero from '@/components/Hero'
import Features from '@/components/Feature'
import How from '@/components/How'
import Why from '@/components/Why'
import Testimonials from '@/components/Testimonial'
import Footer from '@/components/Footer'
import { Locale } from '@/i18n/routing'
import ChatWidget from '@/components/ChatWidget'


// import en from '@/locales/en.json'
// import hi from '@/locales/hi.json'
// import ta from '@/locales/ta.json'
// import bn from '@/locales/bn.json'
// import mr from '@/locales/mr.json'

// type Locale = typeof en

// function getLocale(lang: string): Locale {
//   switch (lang) {
//     case 'hi': return "hi"
//     case 'ta': return "ta"
//     case 'bn': return "bn"
//     case 'mr': return "mr"
//     default: return en
//   }
// }

export default function Page({ params }: { params: { lang: string } }) {
  const lang = (params.lang || 'en').toLowerCase()
  // const t = getLocale(lang)

  return (
    <main className="min-h-screen">
      {/* <Navbar /> */}

      {/* Hero Section */}
      <Hero lang={lang}/>

      {/* Features Section */}
      <Features />

      {/* How It Works Section */}
      <How />

      {/* Why Rainwater Harvesting Section */}
      <Why />

      {/* Testimonials Section */}
      <Testimonials />

      {/* Footer */}
      <Footer />

      <ChatWidget />
    </main>
  )
}