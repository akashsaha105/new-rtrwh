/* eslint-disable @next/next/no-img-element */
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Menu, X, Droplets, UserCircleIcon } from "lucide-react";
import { motion } from "framer-motion";
import LoginModal from "./modals/LoginModal";
import { closeLoginModal, closeSignupModal } from "@/redux/slices/modalSlice";
// import { AppDispatch } from "@/redux/store";
import SignupModal from "./modals/SignupModal";
import LanguageSelector from "./LanguageSwitcher";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { auth } from "@/firebase";
import { useDispatch } from "react-redux";
// import LoadingPage from "./Loading";
import DashboardButton from "./Button";
import NGOCircleButton from "./NGO/Button";

interface NavbarProps {
  t?: {
    nav?: {
      home?: string;
      features?: string;
      how?: string;
      why?: string;
      contact?: string;
      cta?: string;
    };
  };
  lang?: string;
}

const Navbar = ({ t, lang = "en" }: NavbarProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const languages = [
    { code: "en", name: "English", flag: "🇺🇸" },
    { code: "hi", name: "हिन्दी", flag: "🇮🇳" },
    { code: "ta", name: "தமிழ்", flag: "🇮🇳" },
    { code: "bn", name: "বাংলা", flag: "🇧🇩" },
    { code: "mr", name: "मराठी", flag: "🇮🇳" },
  ];

  const navLinks = [
    { name: t?.nav?.home || "Home", href: "#home" },
    { name: t?.nav?.features || "Features", href: "#features" },
    { name: t?.nav?.how || "How It Works", href: "#how" },
    { name: t?.nav?.why || "Why Harvest?", href: "#why" },
    { name: t?.nav?.contact || "About", href: "#about" },
    { name: t?.nav?.contact || "Contact", href: "#footer" },
  ];

  const [language, setLanguage] = useState("EN"); // default English

  //  Load language from localStorage on first render
  useEffect(() => {
    const storedLang = localStorage.getItem("app_language");
    if (storedLang) {
      setLanguage(storedLang);
    }
  }, []);

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true); // start as loading until auth resolved
  const dispatch = useDispatch();

  console.log(loading)


  // Dropdown Menu state and outside-click handling
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
    if (!currentUser) {
      setUser(null);
      return;
    }

    // If admin
    if (currentUser.email === "admin123@admin.com") {
      setUser(currentUser);
    }
    // If Google login → skip emailVerified check
    else if (currentUser.providerData[0]?.providerId === "google.com") {
      setUser(currentUser);
    }
    // If email/password login → require verification
    else if (currentUser.emailVerified) {
      setUser(currentUser);
    } else {
      setUser(null);
    }
  });

  return () => unsubscribe();
}, []);


  const handleSignOut = useCallback(() => {
    setLoading(true);
    setOpen(false); // reset dropdown
    signOut(auth)
      .then(() => {
        setUser(null);
        dispatch(closeLoginModal());
        dispatch(closeSignupModal());
      })
      .finally(() => setLoading(false));
  }, [dispatch]);

  // if (loading) return <LoadingPage />;
  return (
    <nav className="fixed top-0 left-0 w-full z-50 glass shadow-glow  ">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center space-x-2 text-2xl font-bold"
        >
          <div className="relative">
            <Droplets className="w-8 h-8 text-[#00b4d8]" />
            {/* <Home className="w-4 h-4 text-[#48bb78] absolute -top-1 -right-1" /> */}
          </div>
          <span className="bg-gradient-to-r from-[#00b4d8] to-[#48bb78] bg-clip-text text-transparent">
            JalYantra
          </span>
        </Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center space-x-8">
          {navLinks.map((link, idx) => (
            <motion.div
              key={idx}
              whileHover={{ y: -2 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <Link
                href={link.href}
                className="text-gray-300 hover:text-[#00b4d8] transition-colors font-medium"
              >
                {link.name}
              </Link>
            </motion.div>
          ))}

          <LanguageSelector
            language={language}
            setLanguage={setLanguage}
            page=""
          />

          {user ? (
            <>
              <DashboardButton />
              {/* User Info Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <div
                  onClick={() => setOpen((prev) => !prev)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl cursor-pointer 
               bg-gray-800 hover:bg-gray-700 text-white transition select-none"
                >
                  {/* Avatar */}
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt="User Avatar"
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div
                      className="w-8 h-8 flex items-center justify-center rounded-full 
                      bg-gradient-to-r from-[#00b4d8] to-[#48bb78] text-white font-semibold"
                    >
                      {user.displayName?.[0]?.toUpperCase() ||
                        user.email?.[0]?.toUpperCase()}
                    </div>
                  )}

                  {/* Name / Email */}
                  <span className="hidden md:block max-w-[150px] truncate font-medium">
                    {user.email == "admin123@admin.com" ? "admin" : user.displayName}
                  </span>
                </div>

                {/* Dropdown */}
                {open && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 mt-3 w-56 rounded-2xl shadow-xl 
                 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 z-50"
                  >
                    {/* User Info Card Header */}
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {user.email == "admin123@admin.com" ? "admin" : user.displayName}
                      </p>
                      <p className="text-sm text-gray-500 truncate">
                        {user.email}
                      </p>
                    </div>

                    {/* Menu Links */}
                    <div className="flex flex-col">
                      <Link
                        href="/profile"
                        className="flex items-center gap-2 px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-800 transition text-gray-700 dark:text-gray-200"
                      >
                        <UserCircleIcon className="w-5 h-5" />
                        Profile
                      </Link>

                      <button
                        type="button"
                        onClick={handleSignOut}
                        className="flex items-center gap-2 px-4 py-3 hover:bg-red-500/10 text-red-600 transition"
                      >
                        <X className="w-5 h-5" />
                        Sign out
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>
            </>
          ) : (
            <>
              <LoginModal />
              <SignupModal />
              <NGOCircleButton />
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden text-gray-300"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <motion.div
          initial={{ height: 0 }}
          animate={{ height: "auto" }}
          exit={{ height: 0 }}
          className="md:hidden glass shadow-glow"
        >
          <div className="flex flex-col space-y-4 px-6 py-6">
            {navLinks.map((link, idx) => (
              <Link
                key={idx}
                href={link.href}
                className="text-gray-300 hover:text-[#00b4d8] font-medium transition"
                onClick={() => setIsOpen(false)}
              >
                {link.name}
              </Link>
            ))}

            {/* Language Switcher for Mobile */}
            <div className="pt-4 border-t border-gray-700">
              <p className="text-sm text-gray-400 mb-2">Language</p>
              <div className="flex flex-wrap gap-2">
                {languages.map((language) => (
                  <button
                    key={language.code}
                    className={`px-3 py-1 rounded-lg text-sm transition ${
                      language.code === lang
                        ? "bg-[#0077b6] text-white"
                        : "glass hover:bg-white/10"
                    }`}
                    onClick={() => setIsOpen(false)}
                  >
                    {language.flag} {language.name}
                  </button>
                ))}
              </div>
            </div>

            <Link
              href="Login"
              className="px-5 py-2 bg-gradient-to-r from-[#0077b6] to-[#00b4d8] text-white rounded-xl shadow-glow hover:scale-105 transition text-center font-semibold"
              onClick={() => setIsOpen(false)}
            >
              Login
            </Link>
          </div>
        </motion.div>
      )}
    </nav>
  );
};

export default Navbar;
