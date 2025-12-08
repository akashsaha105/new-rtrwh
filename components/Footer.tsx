'use client'
import React from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { Droplets, Home, Mail, Phone, MapPin, Facebook, Twitter, Instagram, Linkedin, Youtube, Heart } from 'lucide-react'

export default function Footer({ lang }: { lang?: string }) {
  const router = useRouter()

  const quickLinks = [
    { name: "About", href: "#about" },
    { name: "Features", href: "#features" },
    { name: "How It Works", href: "#how" },
    { name: "Why Harvest?", href: "#why" },
    { name: "FAQs", href: "https://www.indiawaterportal.org/faqs/frequently-asked-questions-faqs-rainwater-harvesting-rwh" }
  ]

  const services = [
    { name: "Free Assessment", href: "Signup" },
    { name: "Expert Consultation", href: "Signup" },
    { name: "Contractor Network", href: "Signup" },
    { name: "Installation Support", href: "https://cwas.org.in/resources/file_manager/module_3-3_1_rwh_guidelines.pdf" },
    { name: "Maintenance Guide", href: "https://cmwssb.tn.gov.in/rwh-maintenancetipsrulesandregulations" },
    { name: "Government Schemes", href: "https://cgwb.gov.in/cgwbpnm/public/uploads/documents/1686136871443876411file.pdf" }
  ]

  const socialLinks = [
    { name: "Facebook", icon: Facebook, href: "https://www.facebook.com/", color: "hover:text-blue-400" },
    { name: "Twitter", icon: Twitter, href: "https://x.com/", color: "hover:text-blue-300" },
    { name: "Instagram", icon: Instagram, href: "https://www.instagram.com/", color: "hover:text-pink-400" },
    { name: "LinkedIn", icon: Linkedin, href: "https://www.linkedin.com/", color: "hover:text-blue-500" },
    { name: "YouTube", icon: Youtube, href: "https://www.youtube.com/watch?v=I4V0QiyKAYs", color: "hover:text-red-500" }
  ]

  return (
    <footer id='footer'   className="relative mt-20">
      {/* Wave Divider */}
      <div className="bg-zinc-800 h-0.5"></div>
      
      {/* Main Footer */}
      <div className="bg-gradient-to-b from-[#0a0a0a] to-[#1a1a1a] pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-6">
          {/* Top Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
            {/* Company Info */}
            <div className="lg:col-span-1">
              <div className="flex items-center space-x-3 mb-6">
                <div className="relative">
                  <Droplets className="w-8 h-8 text-[#00b4d8]" />
                  <Home className="w-4 h-4 text-[#48bb78] absolute -top-1 -right-1" />
                </div>
                <span className="text-2xl font-bold bg-gradient-to-r from-[#00b4d8] to-[#48bb78] bg-clip-text text-transparent">
                  RooftopRain
                </span>
              </div>
              
              <p className="text-gray-300 mb-6 leading-relaxed">
                AI-powered rooftop rainwater harvesting assessment platform. 
                Making water conservation accessible, affordable, and sustainable for everyone.
              </p>

              {/* Contact Info */}
              <div className="space-y-3">
                <div className="flex items-center space-x-3 text-gray-300">
                  <Mail className="w-4 h-4 text-[#00b4d8]" />
                  <span className="text-sm">support@rooftoprain.com</span>
                </div>
                <div className="flex items-center space-x-3 text-gray-300">
                  <Phone className="w-4 h-4 text-[#00b4d8]" />
                  <span className="text-sm">+91 90078 91237</span>
                </div>
                <div className="flex items-center space-x-3 text-gray-300">
                  <MapPin className="w-4 h-4 text-[#00b4d8]" />
                  <span className="text-sm">Kolkata, India</span>
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-6">Quick Links</h3>
              <ul className="space-y-3">
                {quickLinks.map((link, index) => (
                  <li key={index}>
                    <a 
                      href={link.href} 
                      className="text-gray-300 hover:text-[#00b4d8] transition-colors text-sm"
                    >
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Services */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-6">Services</h3>
              <ul className="space-y-3">
                {services.map((service, index) => (
                  <li key={index}>
                    <a 
                      href={service.href} 
                      className="text-gray-300 hover:text-[#48bb78] transition-colors text-sm"
                    >
                      {service.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Newsletter & Social */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-6">Stay Updated</h3>
              
              {/* Newsletter */}
              <div className="mb-6">
                <p className="text-gray-300 text-sm mb-4">
                  Get the latest updates on water conservation and new features.
                </p>
                <div className="flex">
                  <input 
                    type="email" 
                    placeholder="Enter your email"
                    className="flex-1 px-4 py-2 bg-gray-800 border border-gray-600 rounded-l-lg text-white text-sm focus:outline-none focus:border-[#00b4d8]"
                  />
                  <button className="px-4 py-2 bg-gradient-to-r from-[#0077b6] to-[#00b4d8] text-white rounded-r-lg hover:scale-105 transition text-sm font-medium">
                    Subscribe
                  </button>
                </div>
              </div>

              {/* Social Links */}
              <div>
                <p className="text-gray-300 text-sm mb-4">Follow us on social media</p>
                <div className="flex space-x-4">
                  {socialLinks.map((social, index) => (
                    <motion.a
                      key={index}
                      href={social.href}
                      whileHover={{ y: -2 }}
                      className={`text-gray-400 ${social.color} transition-colors`}
                      aria-label={social.name}
                    >
                      <social.icon className="w-5 h-5" />
                    </motion.a>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="border-t border-gray-700 pt-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              {/* Copyright */}
              <div className="flex items-center space-x-2 text-gray-400 text-sm">
                <span>© 2025 RooftopRain. All rights reserved.</span>
                <span className="hidden md:inline">•</span>
                <span className="hidden md:inline">Made with</span>
                <Heart className="w-4 h-4 text-red-500 fill-current" />
                <span>for Sustainable Future</span>
              </div>

              {/* Legal Links */}
              <div className="flex items-center space-x-6 text-sm">
                <a href="#privacy" className="text-gray-400 hover:text-[#00b4d8] transition-colors">
                  Privacy Policy
                </a>
                <a href="#terms" className="text-gray-400 hover:text-[#00b4d8] transition-colors">
                  Terms of Service
                </a>
                <a href="#cookies" className="text-gray-400 hover:text-[#00b4d8] transition-colors">
                  Cookie Policy
                </a>
              </div>

              {/* Language Selector */}
              <div className="flex items-center space-x-2">
                <span className="text-gray-400 text-sm">Language:</span>
                <select 
                  aria-label="footer-language" 
                  value={lang} 
                  onChange={(e) => router.push(`/${e.target.value}`)} 
                  className="bg-gray-800 border border-gray-600 rounded-md px-3 py-1 text-sm text-white focus:outline-none focus:border-[#00b4d8]"
                >
                  {[
                    { code: 'en', name: 'English' },
                    { code: 'hi', name: 'हिन्दी' },
                    { code: 'ta', name: 'தமிழ்' },
                    { code: 'bn', name: 'বাংলা' },
                    { code: 'mr', name: 'मराठी' }
                  ].map(l => (
                    <option key={l.code} value={l.code}>
                      {l.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}