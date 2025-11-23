'use client'
import React from 'react'
import { motion } from 'framer-motion'
import { Ruler, Droplets, Zap, Users, BarChart3, Wrench, Smartphone } from 'lucide-react'

const featuresList = [
  {
    icon: Ruler,
    title: "Instant Rooftop Size Detection",
    subtitle: "via AR/Camera",
    description: "Scan your rooftop using AR technology or camera to instantly measure dimensions and calculate catchment area.",
    color: "from-[#0077b6] to-[#00b4d8]",
    bgColor: "bg-[#0077b6]/10"
  },
  {
    icon: Droplets,
    title: "Rainfall Data Integration",
    subtitle: "Real-time Weather Data",
    description: "Access local rainfall patterns and historical data to calculate optimal water collection potential for your area.",
    color: "from-[#00b4d8] to-[#48bb78]",
    bgColor: "bg-[#00b4d8]/10"
  },
  {
    icon: Zap,
    title: "On-spot Recharge Potential",
    subtitle: "& Tank Size Calculation",
    description: "Get instant calculations for optimal tank sizes, recharge structures, and water storage capacity based on your specific needs.",
    color: "from-[#48bb78] to-[#0077b6]",
    bgColor: "bg-[#48bb78]/10"
  },
  {
    icon: Users,
    title: "Book Experts & Masons",
    subtitle: "via the App",
    description: "Connect with certified contractors, masons, and rainwater harvesting experts in your area for professional installation.",
    color: "from-[#0077b6] to-[#48bb78]",
    bgColor: "bg-[#0077b6]/10"
  }
]

export default function Features() {
  return (
    <section id="features" className="py-20 relative">
      {/* Background Elements */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-[#0077b6] rounded-full mix-blend-multiply filter blur-3xl opacity-10"></div>
        <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-[#00b4d8] rounded-full mix-blend-multiply filter blur-3xl opacity-10"></div>
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
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <span className="text-sm font-medium text-[#00b4d8] uppercase tracking-wide">
              Powerful Features
            </span>
          </div>

          <h2 className="text-4xl md:text-6xl font-extrabold mb-6">
            <span className="bg-gradient-to-r from-white to-[#00b4d8] bg-clip-text text-transparent">
              Everything You Need
            </span>
            <br />
            <span className="bg-gradient-to-r from-[#48bb78] to-[#0077b6] bg-clip-text text-transparent">
              For Smart Water Management
            </span>
          </h2>

          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Our AI-powered platform provides comprehensive tools for rooftop rainwater harvesting assessment,
            from initial measurement to expert consultation.
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {featuresList.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.2, duration: 0.8 }}
              className="group relative"
            >
              <div className="relative p-8 rounded-3xl glass shadow-glow hover:shadow-2xl transition-all duration-500 hover:scale-105 border border-gray-700/50">
                {/* Background Gradient */}
                <div className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${feature.color} opacity-5 group-hover:opacity-10 transition-opacity duration-500`}></div>

                {/* Content */}
                <div className="relative z-10">
                  {/* Icon */}
                  <div className="mb-6">
                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${feature.color} flex items-center justify-center shadow-glow`}>
                      <feature.icon className="w-8 h-8 text-white" />
                    </div>
                  </div>

                  {/* Title & Subtitle */}
                  <div className="mb-4">
                    <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-[#00b4d8] transition-colors">
                      {feature.title}
                    </h3>
                    <p className="text-sm font-medium text-[#00b4d8] uppercase tracking-wide">
                      {feature.subtitle}
                    </p>
                  </div>

                  {/* Description */}
                  <p className="text-gray-300 leading-relaxed mb-6">
                    {feature.description}
                  </p>

                  {/* Learn More Link */}
                  <div className="flex items-center text-[#00b4d8] font-medium group-hover:text-[#48bb78] transition-colors">
                    <span className="mr-2">Learn More</span>
                    <motion.div
                      animate={{ x: [0, 5, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      →
                    </motion.div>
                  </div>
                </div>

                {/* Decorative Elements */}
                <div className="absolute top-4 right-4 w-2 h-2 bg-[#00b4d8] rounded-full opacity-60"></div>
                <div className="absolute bottom-4 left-4 w-1 h-1 bg-[#48bb78] rounded-full opacity-40"></div>
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
          <div className="inline-flex items-center space-x-4 p-6 rounded-2xl glass shadow-glow">
            <div className="flex items-center space-x-3">
              <Smartphone className="w-6 h-6 text-[#00b4d8]" />
              <span className="text-white font-semibold">Available on Mobile & Web</span>
            </div>
            <div className="w-px h-6 bg-gray-600"></div>
            <div className="flex items-center space-x-3">
              <Wrench className="w-6 h-6 text-[#48bb78]" />
              <span className="text-white font-semibold">Expert Support Included</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}