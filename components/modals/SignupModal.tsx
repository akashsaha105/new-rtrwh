"use client";

/* eslint-disable @next/next/no-img-element */
import React, { FormEvent, useState } from "react";
import { Modal } from "@mui/material";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "@/redux/store";
import {
  openSignupModal,
  closeSignupModal,
  openLoginModal,
} from "@/redux/slices/modalSlice";
import { EyeIcon, EyeSlashIcon, XMarkIcon } from "@heroicons/react/24/solid";
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  sendEmailVerification,
  signInWithPopup,
  updateProfile,
} from "firebase/auth";
import { motion } from "framer-motion";
import { auth, firestore } from "@/firebase";
import { FirebaseError } from "firebase/app";
import { useRouter } from "next/navigation";
import { doc, runTransaction, setDoc } from "firebase/firestore";
// import { googleProvider } from "@/firebase";

function getUsernameFromEmail(email: string | null): string {
  if (!email) return "";
  const atIndex = email.lastIndexOf("@");
  return atIndex === -1 ? email : email.substring(0, atIndex);
}

// Generates a custom UID like rtrw-1, rtrw-2 safely
async function generateCustomUID(): Promise<string> {
  const counterRef = doc(firestore, "counters", "userCounter");

  const customUID = await runTransaction(firestore, async (transaction) => {
    const counterSnap = await transaction.get(counterRef);
    let nextNumber = 1;

    if (counterSnap.exists()) {
      nextNumber = (counterSnap.data().lastNumber || 0) + 1;
    }

    transaction.set(counterRef, { lastNumber: nextNumber });
    return `USR${nextNumber}`;
  });

  return customUID;
}

const SignupModal = () => {
  const isOpen = useSelector(
    (state: RootState) => state.modals.signupModalIsOpen
  );
  const dispatch: AppDispatch = useDispatch();
  const route = useRouter();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);

  const handleSignup = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);

    try {
      // Creating account using email and password
      const { user } = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      // After account is created, update the name of the profile
      await updateProfile(user, {
        displayName: getUsernameFromEmail(email),
      });

      const customUID = await generateCustomUID();
      // ==================================================================
      // 🔥 CREATE FIRESTORE USER DOCUMENT IMMEDIATELY AFTER SIGNUP
      // ==================================================================
      const docRef = doc(firestore, "users", user.uid);
      await setDoc(docRef, {
        username: getUsernameFromEmail(email),
        email: email,
        fullName: "",
        phoneNumber: "",
        location: {
          state: "",
          city: "",
          address: "",
        },
        mode: "free",
        status: "inactive",
        reward: 0,
        createdAt: new Date(),
        uid: customUID,
      });
      // ==================================================================

      // Send email verification immediately
      await sendEmailVerification(user);
      setLoading(true);
      alert("Email verification is send to your account");

      // Close the signup modal if the account is created and email is sent.
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      dispatch(closeSignupModal());
    } catch (error) {
      const err = error as FirebaseError;

      if (err.code === "auth/email-already-in-use") {
        alert("This email is already registered. Please log in instead.");
      } else if (err.code === "auth/invalid-email") {
        alert("Invalid email format.");
      } else if (err.code === "auth/weak-password") {
        alert("Password should be at least 6 characters.");
      } else {
        alert(err.message);
      }
    } finally {
      setLoading(false);
    }

    setEmail("");
    setPassword("");
    setConfirmPassword("");
  };

  // ------------------------------------------------------
  // 🔥 GOOGLE SIGNUP — AUTO USERNAME + displayName update
  // ------------------------------------------------------

  const handleGoogleSignup = async () => {
    try {
      setLoading(true);

      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);

      const user = result.user;

      const customUID = await generateCustomUID();

      // If Google doesn't give a name, generate from email
      const generatedName = getUsernameFromEmail(user.email);
      await updateProfile(user, { displayName: generatedName });

      // ============================================================
      // 🔥 CREATE FIRESTORE USER DOCUMENT AFTER GOOGLE SIGNUP
      // ============================================================
      const docRef = doc(firestore, "users", user.uid);
      await setDoc(
        docRef,
        {
          username: generatedName,
          email: user.email || "",
          fullName: "",
          phoneNumber: user.phoneNumber || "",
          photoURL: user.photoURL || "",
          location: {
            state: "",
            city: "",
            address: "",
          },
          mode: "free",
          status: "inactive",
          reward: 0,
          createdAt: new Date(),
          uid: customUID,
        },
        { merge: true }
      );
      // ============================================================

      // alert("Signup successful!");
      dispatch(closeSignupModal());
      route.push("/en/dashboard");
    } catch (error) {
      handleAuthErrors(error as FirebaseError);
    } finally {
      setLoading(false);
    }
  };

  // ------------------------------------------------------
  // 🔧 Helper: Reset all fields
  // ------------------------------------------------------
  // const resetFields = () => {
  //   setEmail("");
  //   setPassword("");
  //   setConfirmPassword("");
  // };

  // ------------------------------------------------------
  // 🔧 Helper: Handle all Firebase errors
  // ------------------------------------------------------
  const handleAuthErrors = (err: FirebaseError) => {
    switch (err.code) {
      case "auth/email-already-in-use":
        alert("This email is already registered. Please log in instead.");
        break;
      case "auth/invalid-email":
        alert("Invalid email format.");
        break;
      case "auth/weak-password":
        alert("Password must be at least 6 characters.");
        break;
      default:
        alert(err.message);
    }
  };

  // if (loading) return <LoadingPage />;

  return (
    <div>
      <button
        className="px-5 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-xl shadow-lg hover:scale-105 transition font-semibold"
        onClick={() => dispatch(openSignupModal())}
      >
        Sign up
      </button>

      <Modal
        open={isOpen}
        onClose={() => dispatch(closeSignupModal())}
        className="flex justify-center items-center"
      >
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="relative w-full max-w-md bg-gray-900/90 backdrop-blur-xl rounded-2xl shadow-2xl p-8 border border-gray-700"
          >
            {/* Close Button */}
            <button
              onClick={() => dispatch(closeSignupModal())}
              className="absolute top-4 right-4 text-gray-400 hover:text-white cursor-pointer"
              aria-label="Close"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>

            {/* Title */}
            <h2 className="text-3xl font-bold text-center mb-8 bg-gradient-to-r from-white via-sky-200 to-cyan-300 bg-clip-text text-transparent">
              Create Account
            </h2>

            {/* Form */}
            <form onSubmit={handleSignup} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  required
                  className="w-full px-4 py-2 bg-gray-800/70 text-white border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  onChange={(e) => setEmail(e.target.value)}
                  value={email}
                />
              </div>

              {/* Password */}
              <div className="relative">
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Password
                </label>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  required
                  className="w-full px-4 py-2 bg-gray-800/70 text-white border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  onChange={(e) => setPassword(e.target.value)}
                  value={password}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-11 right-3 flex items-center text-gray-400 hover:text-gray-200"
                >
                  {showPassword ? (
                    <EyeSlashIcon className="w-5 h-5" />
                  ) : (
                    <EyeIcon className="w-5 h-5" />
                  )}
                </button>
              </div>

              {/* Confirm Password */}
              <div className="relative">
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Confirm Password
                </label>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Re-enter your password"
                  required
                  className="w-full px-4 py-2 bg-gray-800/70 text-white border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  value={confirmPassword}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-11 right-3 flex items-center text-gray-400 hover:text-gray-200"
                >
                  {showConfirmPassword ? (
                    <EyeSlashIcon className="w-5 h-5" />
                  ) : (
                    <EyeIcon className="w-5 h-5" />
                  )}
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 text-white py-2 rounded-lg shadow-md hover:opacity-90 transition font-semibold"
              >
                {loading ? "Creating Account..." : "Sign Up"}
              </button>
            </form>

            {/* Divider */}
            <div className="flex items-center my-6">
              <div className="flex-grow h-px bg-gray-700" />
              <span className="px-3 text-gray-400 text-sm">or</span>
              <div className="flex-grow h-px bg-gray-700" />
            </div>

            {/* Social Signup */}
            <button
              // onClick={async () => await signInWithPopup(auth, googleProvider)}
              onClick={() => handleGoogleSignup()}
              className="w-full flex items-center justify-center gap-2 border border-gray-700 bg-gray-800/80 text-gray-300 py-2 rounded-lg hover:bg-gray-700 transition cursor-pointer"
            >
              <img
                src="https://www.svgrepo.com/show/475656/google-color.svg"
                alt="Google"
                className="w-5 h-5"
              />
              Continue with Google
            </button>

            {/* Footer */}
            <p className="mt-6 text-center text-sm text-gray-300">
              Already have an account?{" "}
              <a
                className="text-cyan-400 underline cursor-pointer"
                onClick={(e) => {
                  e.preventDefault();
                  dispatch(closeSignupModal());
                  dispatch(openLoginModal());
                }}
              >
                Log In
              </a>
            </p>
          </motion.div>
        </div>
      </Modal>
    </div>
  );
};

export default SignupModal;
