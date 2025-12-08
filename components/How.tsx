'use client'
import React from 'react'
import { motion } from 'framer-motion'
import { Camera, CloudRain, Calculator, Users, ArrowRight, CheckCircle } from 'lucide-react'
import Link from 'next/link';
import {
  Droplets,
  Zap,
} from "lucide-react";


const steps = [
  {
    number: "01",
    icon: Camera,
    title: "Enter Rooftop Size or Scan via AR",
    description: "Provide your rooftop dimensions manually or use our AR camera feature to automatically measure and calculate the catchment area.",
    color: "from-[#0077b6] to-[#00b4d8]",
    details: [
      "AR-powered measurement tool",
      "Manual dimension input option",
      "Automatic area calculation",
      "3D rooftop visualization"
    ]
  },
  {
    number: "02",
    icon: CloudRain,
    title: "App Fetches Rainfall Data",
    description: "Our AI system automatically retrieves local rainfall patterns, historical data, and weather information for your specific location.",
    color: "from-[#00b4d8] to-[#48bb78]",
    details: [
      "Real-time weather integration",
      "Historical rainfall analysis",
      "Seasonal pattern recognition",
      "Local climate data"
    ]
  },
  {
    number: "03",
    icon: Calculator,
    title: "Suggests Ideal RTRWH/AR Structure",
    description: "Get personalized recommendations for optimal rainwater harvesting systems, tank sizes, and artificial recharge structures.",
    color: "from-[#48bb78] to-[#0077b6]",
    details: [
      "Optimal tank size calculation",
      "Recharge structure design",
      "Cost-benefit analysis",
      "Efficiency optimization"
    ]
  },
  {
    number: "04",
    icon: Users,
    title: "Connects You with Certified Contractors",
    description: "Access our network of verified contractors, masons, and rainwater harvesting experts for professional installation and consultation.",
    color: "from-[#0077b6] to-[#48bb78]",
    details: [
      "Verified contractor network",
      "Expert consultation booking",
      "Installation support",
      "Quality assurance"
    ]
  }
]

export default function How({lang}) {
  return (
    <section id="how" className="py-20 relative">
      {/* Background Elements */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-[#00b4d8] rounded-full mix-blend-multiply filter blur-3xl opacity-5"></div>
        <div className="absolute bottom-1/4 right-1/3 w-96 h-96 bg-[#48bb78] rounded-full mix-blend-multiply filter blur-3xl opacity-5"></div>
      </div>

      <div className="max-w-7xl mx-auto px-6">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="p-2 rounded-lg bg-gradient-to-r from-[#0077b6] to-[#00b4d8]">
              <Calculator className="w-6 h-6 text-white" />
            </div>
            <span className="text-sm font-medium text-[#00b4d8] uppercase tracking-wide">
              Simple Process
            </span>
          </div>
          
          <h2 className="text-4xl md:text-6xl font-extrabold mb-6">
            <span className="bg-gradient-to-r from-white to-[#00b4d8] bg-clip-text text-transparent">
              How It Works
            </span>
          </h2>
          
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Get your rooftop rainwater harvesting assessment in just 4 simple steps. 
            From measurement to expert consultation, we&apos;ve got you covered.
          </p>
        </motion.div>

        {/* Steps */}
        <div className="space-y-12">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.2, duration: 0.8 }}
              className="relative"
            >
              {/* Connection Line */}
              {index < steps.length - 1 && (
                <div className="absolute left-8 top-24 w-0.5 h-24 bg-gradient-to-b from-[#00b4d8] to-[#48bb78] opacity-30"></div>
              )}

              <div className="flex flex-col lg:flex-row items-start gap-8">
                {/* Step Number & Icon */}
                <div className="flex-shrink-0">
                  <div className="relative">
                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${step.color} flex items-center justify-center shadow-glow`}>
                      <step.icon className="w-8 h-8 text-white" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-[#0077b6] rounded-full flex items-center justify-center">
                      <span className="text-xs font-bold text-white">{step.number}</span>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1">
                  <div className="p-8 rounded-3xl glass shadow-glow border border-gray-700/50">
                    <h3 className="text-2xl font-bold text-white mb-4">
                      {step.title}
                    </h3>
                    
                    <p className="text-gray-300 text-lg mb-6 leading-relaxed">
                      {step.description}
                    </p>

                    {/* Features List */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {step.details.map((detail, detailIndex) => (
                        <div key={detailIndex} className="flex items-center space-x-3">
                          <CheckCircle className="w-5 h-5 text-[#48bb78] flex-shrink-0" />
                          <span className="text-gray-300 text-sm">{detail}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Arrow for Desktop */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:flex items-center justify-center mt-8">
                    <motion.div
                      animate={{ x: [0, 10, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="p-3 rounded-full glass border border-gray-600"
                    >
                      <ArrowRight className="w-6 h-6 text-[#00b4d8]" />
                    </motion.div>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.8, duration: 0.8 }}
          className="text-center mt-16"
        >
          <div className="inline-flex flex-col sm:flex-row items-center gap-4 p-8 rounded-3xl glass shadow-glow">
            <div className="text-center sm:text-left">
              <h3 className="text-2xl font-bold text-white mb-2">Ready to Get Started?</h3>
              <p className="text-gray-300">Join thousands of users who have already assessed their rainwater harvesting potential.</p>
            </div>
            <Link
              className="px-8 py-4 bg-gradient-to-r from-[#0077b6] to-[#00b4d8] text-white rounded-xl shadow-glow hover:scale-105 transform transition font-semibold text-lg flex items-center justify-center space-x-2 cursor-pointer"
              href={`${lang || 'en'}/assessment`}
            >
              <Zap className="w-5 h-5" />
              <span>Try Free Assessment</span>
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  )
}