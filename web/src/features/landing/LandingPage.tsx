'use client'

import { useEffect } from 'react'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import './styles/landing.css'
import { CodeStage } from './components/CodeStage.tsx'
import { FeatureBento } from './components/FeatureBento.tsx'
import { FinalCTA } from './components/FinalCTA.tsx'
import { GatewayChapter } from './components/GatewayChapter.tsx'
import { Hero } from './components/Hero.tsx'
import { LandingFooter } from './components/LandingFooter.tsx'
import { LandingNav } from './components/LandingNav.tsx'
import { Pricing } from './components/Pricing.tsx'
import { ProblemScene } from './components/ProblemScene.tsx'
import { SignalStrip } from './components/SignalStrip.tsx'

export function LandingPage() {
  useEffect(() => {
    const prev = document.documentElement.style.scrollBehavior
    document.documentElement.style.scrollBehavior = 'smooth'
    return () => {
      document.documentElement.style.scrollBehavior = prev
    }
  }, [])

  return (
    <div
      className={`landing min-h-screen ${GeistSans.variable} ${GeistMono.variable} ${GeistSans.className}`}
      style={
        {
          '--font-geist-mono': GeistMono.style.fontFamily,
        } as React.CSSProperties
      }
    >
      <LandingNav />
      <main>
        <Hero />
        <SignalStrip />
        <ProblemScene />
        <GatewayChapter />
        <FeatureBento />
        <CodeStage />
        <Pricing />
        <FinalCTA />
      </main>
      <LandingFooter />
    </div>
  )
}
