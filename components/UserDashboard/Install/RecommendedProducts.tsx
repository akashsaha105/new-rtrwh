/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from "react";
import { auth, firestore } from "@/firebase";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import {
  collection,
  onSnapshot,
  doc,
  runTransaction,
  serverTimestamp,
  getDoc,
} from "firebase/firestore";
import { CreditCard, Star, X, Leaf } from "lucide-react";
import { motion } from "framer-motion";
import { QRCodeCanvas } from "qrcode.react";

/**
 * Final RecommendedProducts (Green sustainability theme)
 *
 * Behavior:
 * - totalPrice = product.price + (product.reward ?? 0)
 * - Admin controls the fixed reward amount per product (product.reward)
 * - If user has >= product.reward points, pointsUsed = product.reward and moneyPaid = product.price
 * - Else pointsUsed = 0 and moneyPaid = totalPrice
 *
 * Payment UI:
 * - Click Buy -> modal shows summary + two big buttons: UPI, Cash
 * - UPI: opens a QR modal (static image). After user confirms they scanned/paid, transaction runs.
 * - Cash: reveals "Apply for Cash Payment" button in the modal. Clicking it records an order with status "pending-cash".
 *
 * Props:
 * - currentUserId?: string (optional; fallback to getAuth().currentUser)
 * - rupeePerPoint?: number (default 1)
 */

interface Product {
  id: string;
  imageUrl: string;
  name: string;
  description: string;
  price: number; // base cash component
  rewardPoints?: number; // admin fixed reward points contribution (fixed)
  quantity: number;
  category: string;
}

interface Props {
  currentUserId?: string;
  rupeePerPoint?: number;
}

const RecommendedProducts: React.FC<Props> = ({
  currentUserId,
  rupeePerPoint = 1,
}) => {
  const [rewardModal, setRewardModal] = useState<
    | { open: true; product: Product; mode: null | "upi" | "cash" }
    | { open: false }
  >({ open: false });

  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  const [internalUid, setInternalUid] = useState<string | null>(null);
  const [userPoints, setUserPoints] = useState<number | null>(null);

  const [applyCash, setApplyCash] = useState(false);
  const [userData, setUserData] = useState();

  // simple modal state: shows confirm modal with payment options
  const [confirmModal, setConfirmModal] = useState<
    | { open: true; product: Product; mode: null | "upi" | "cash" }
    | { open: false }
  >({ open: false });

  // QR modal (separate) shown after clicking UPI
  const [qrModalOpen, setQrModalOpen] = useState(false);

  // When Cash clicked, reveal apply button inside confirm modal
  const [cashApplyVisible, setCashApplyVisible] = useState(false);

  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (currentUserId) {
      setInternalUid(currentUserId);
      return;
    }
    try {
      const auth = getAuth();
      setInternalUid(auth.currentUser?.uid ?? null);
    } catch {
      setInternalUid(null);
    }
  }, [currentUserId]);

  // subscribe products
  useEffect(() => {
    const unsub = onSnapshot(
      collection(firestore, "products"),
      (snap) => {
        const list = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as any),
        })) as Product[];
        setProducts(list);
        setLoadingProducts(false);
      },
      (err) => {
        console.error("products snapshot error:", err);
        setLoadingProducts(false);
      }
    );
    return () => unsub();
  }, []);

  // subscribe user reward balance
  useEffect(() => {
    if (!internalUid) {
      setUserPoints(null);
      return;
    }
    const userRef = doc(firestore, "users", internalUid);
    const unsub = onSnapshot(
      userRef,
      (snap) => {
        const data = snap.data?.() ?? {};
        const pts = (data?.reward ?? data?.points ?? 0) as number;
        setUserPoints(typeof pts === "number" ? pts : 0);
      },
      (err) => {
        console.error("user points snapshot error:", err);
        setUserPoints(null);
      }
    );
    return () => unsub();
  }, [internalUid]);

  // helpers
  const totalPrice = (p: Product) => p.price + (p.rewardPoints ?? 0);
  // fixed admin reward points required to apply
  const requiredRewardPoints = (p: Product) =>
    Math.max(0, Math.floor(p.rewardPoints ?? 0));
  // points are worth rupeePerPoint each
  const moneyAfterReward = (p: Product, userPts: number | null) => {
    const req = requiredRewardPoints(p);
    if ((userPts ?? 0) >= req && req > 0) {
      // user has enough -> reward applied => money to pay = base price
      return p.price;
    }
    // not enough points -> pay full total price
    return totalPrice(p);
  };

  const openConfirm = (product: Product) => {
    setCashApplyVisible(false);
    setConfirmModal({ open: true, product, mode: null });
  };
  const closeConfirm = () => {
    setConfirmModal({ open: false });
    setCashApplyVisible(false);
  };

  // run the transaction for finalizing order (common)
  const finalizeOrder = async (
    product: Product,
    pointsToUse: number,
    moneyPaid: number,
    paymentMode: "upi" | "cash"
  ) => {
    setProcessing(true);

    try {
      // 1) Get current user FIRST (outside transaction)
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error("User is not logged in");

      const userRef = doc(firestore, "users", currentUser.uid);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) throw new Error("User not found");

      const userData = userSnap.data();

      // 2) Run Firestore transaction
      await runTransaction(firestore, async (tx) => {
        const prodRef = doc(firestore, "products", product.id);
        const prodSnap = await tx.get(prodRef);
        if (!prodSnap.exists()) throw new Error("Product not found");

        const prodData = prodSnap.data() as any;
        if (prodData.quantity <= 0) throw new Error("Out of stock");

        // deduct reward points
        if (pointsToUse > 0) {
          const currentPts = userData.reward ?? userData.points ?? 0;

          if (currentPts < pointsToUse)
            throw new Error("Not enough reward balance");

          tx.update(userRef, { reward: currentPts - pointsToUse });
        }

        // reduce product quantity
        tx.update(prodRef, { quantity: prodData.quantity - 1 });

        // create order
        const ordersRef = collection(firestore, "orders");
        const newOrderRef = doc(ordersRef);

        tx.set(newOrderRef, {
          productId: product.id,
          productName: product.name,
          userId: currentUser.uid,

          payment: {
            mode: paymentMode,
            moneyPaid,
            pointsUsed: pointsToUse,
            rupeePerPoint,
          },

          productPrice: totalPrice(product),

          // 🔥 IMPORTANT: correct field
          orderStatus: "processing",

          // keep your old status if needed
          status: paymentMode === "cash" ? "pending-cash" : "paid",

          // user details
          fullName: userData.fullName,
          geoPoint: {
            lat: userData.geopoint?.[0] ?? null,
            long: userData.geopoint?.[1] ?? null,
          },
          email: userData.email,
          phoneNumber: userData.phoneNumber,
          location: {
            state: userData.location?.state ?? "",
            city: userData.location?.city ?? "",
            address: userData.location?.address ?? "",
          },

          systemStatus: userData.status ?? null,
          rewardPoints: product.rewardPoints,

          createdAt: serverTimestamp(),
        });
      });

      alert(
        `Order successfully placed.\nUsed Points: ${pointsToUse}\nMoney Paid: ₹${moneyPaid}`
      );
    } catch (err: any) {
      console.error("finalizeOrder error:", err);
      alert("Purchase failed: " + err.message);
    } finally {
      setProcessing(false);
      closeConfirm();
      setQrModalOpen(false);
    }
  };

  // UPI flow: when user confirms scanning/paid from QR
  // const handleUpiConfirm = async () => {
  //   if (!confirmModal.open) return;
  //   const product = confirmModal.product;
  //   const reqPts = requiredRewardPoints(product);
  //   const ptsToUse = (userPoints ?? 0) >= reqPts ? reqPts : 0;
  //   const money = moneyAfterReward(product, userPoints);
  //   await finalizeOrder(product, ptsToUse, money, "upi");
  // };

  // Cash flow: when user clicks Apply for Cash Payment
  const handleCashApply = async () => {
    if (!confirmModal.open) return;
    const product = confirmModal.product;
    const reqPts = requiredRewardPoints(product);
    const ptsToUse = (userPoints ?? 0) >= reqPts ? reqPts : 0;
    const money = moneyAfterReward(product, userPoints);
    // create order but mark pending-cash
    await finalizeOrder(product, ptsToUse, money, "cash");
  };

  if (loadingProducts) {
    return (
      <div className="py-8 text-center text-gray-300">
        Loading recommended products...
      </div>
    );
  }

  return (
    <div>
      <h3
        className="text-2xl font-bold text-emerald-400 mb-6 mt-12 flex items-center gap-3"
        id="recommend"
      >
        <Leaf className="w-5 h-5 text-emerald-300" /> Recommended Products
        <span className="ml-2 text-sm text-emerald-200">
          Support water-needy communities with purchases
        </span>
      </h3>

      <div className="mb-6">
        <div className="text-sm text-emerald-100">
          Reward balance:{" "}
          <strong className="text-emerald-200">
            {userPoints === null ? "—" : `${userPoints} pts`}
          </strong>
          <span className="ml-2 text-xs text-emerald-300">
            Conversion: 1 pt = ₹{rupeePerPoint}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((p) => {
          const canBuy = p.quantity > 0;
          const reqPts = requiredRewardPoints(p);
          const userHasReq = (userPoints ?? 0) >= reqPts && reqPts > 0;
          return (
            <div
              key={p.id}
              className="bg-gradient-to-br from-emerald-900/10 to-emerald-800/5 p-6 rounded-2xl backdrop-blur-sm border border-emerald-800/20 shadow-md hover:shadow-xl transition"
            >
              <div className="relative w-full h-44 mb-4 rounded-xl overflow-hidden">
                <img
                  src={p.imageUrl}
                  alt={p.name}
                  className="w-full h-full object-cover"
                />
                <span className="absolute top-3 left-3 text-xs text-white bg-emerald-600/90 px-2 py-1 rounded-md shadow-md">
                  {p.category}
                </span>
                {!canBuy && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <span className="text-white font-semibold">
                      Out of stock
                    </span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between mb-2">
                <h4 className="text-lg font-semibold text-emerald-50">
                  {p.name}
                </h4>
                <div className="text-sm text-emerald-200">
                  Qty: {p.quantity}
                </div>
              </div>

              <p className="text-emerald-100 text-sm mb-3 line-clamp-3">
                {p.description}
              </p>

              <div className="flex flex-col w-full gap-4">
                <div>
                  {/* Total Price */}
                  <p className="text-xl font-bold text-emerald-200 flex items-center gap-2">
                    ₹ {totalPrice(p).toLocaleString()}
                  </p>

                  {/* Reward contribution highlighted */}
                  <div className="flex items-center gap-2 mt-1">
                    <span className="flex items-center gap-1 bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-md text-xs font-semibold backdrop-blur-sm border border-amber-500/30 shadow-inner">
                      <Star className="w-3 h-3 fill-amber-300 text-amber-300" />
                      +{p.rewardPoints ?? 0} pts
                    </span>

                    <span className="text-xs text-emerald-300">
                      (Reward Contribution)
                    </span>
                  </div>

                  {/* Breakdown below (subtle) */}
                  <p className="text-xs text-emerald-400 mt-1">
                    Breakdown: ₹{p.price} + {p.rewardPoints ?? 0} pts
                  </p>
                </div>

                <div className="flex flex-col gap-2">
                  {/* Buy in Full Cash */}
                  <button
                    onClick={() => openConfirm(p)}
                    disabled={!canBuy || processing}
                    className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg 
      text-white font-semibold transition cursor-pointer
      ${
        canBuy
          ? "bg-emerald-600 hover:bg-emerald-700"
          : "bg-gray-700/40 cursor-not-allowed"
      }
    `}
                  >
                    <CreditCard className="w-4 h-4" />
                    Proceed Without Rewards
                  </button>

                  {/* Use Reward Points */}
                  <button
                    onClick={() =>
                      setRewardModal({ open: true, product: p, mode: null })
                    }
                    disabled={
                      !canBuy ||
                      processing ||
                      (userPoints ?? 0) < requiredRewardPoints(p)
                    }
                    className={`
    relative overflow-hidden group flex items-center justify-center gap-2
    py-3 px-5 rounded-xl font-semibold transition-all duration-300
    backdrop-blur-xl border shadow-lg cursor-pointer
    ${
      (userPoints ?? 0) >= requiredRewardPoints(p)
        ? "bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 text-black border-amber-300 hover:bg-amber-900"
        : "bg-gray-700/40 text-gray-400 cursor-not-allowed border-gray-600"
    }
  `}
                    title={
                      (userPoints ?? 0) >= requiredRewardPoints(p)
                        ? "Use your reward points"
                        : "Not enough reward points"
                    }
                  >
                    {/* Shiny diagonal highlight */}
                    <span
                      className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 
    group-hover:opacity-30 transition-opacity pointer-events-none"
                    />

                    {/* Glow border animation */}
                    <span
                      className="absolute inset-0 rounded-xl border border-transparent
    group-hover:border-amber-300/70 group-hover:shadow-[0_0_20px_rgba(255,191,0,0.5)]
    transition-all duration-300 pointer-events-none"
                    />

                    {/* Icon */}
                    <Star className="w-5 h-5 text-black drop-shadow group-hover:scale-110 transition-transform duration-300" />

                    {/* Text */}
                    <span className="tracking-wide font-bold drop-shadow">
                      Use ₹{p.price}
                    </span>

                    {/* Reward pill */}
                    <span
                      className="
      flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold
      bg-gradient-to-br from-amber-200/80 to-amber-400/80
      text-amber-900 shadow-inner border border-amber-500/40
      group-hover:from-amber-100 group-hover:to-amber-300
      transition-all duration-300
    "
                    >
                      <Star className="w-3 h-3 fill-amber-600 text-amber-900 drop-shadow" />
                      +{p.rewardPoints ?? 0} pts
                    </span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Confirm modal */}
      {confirmModal.open && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={closeConfirm}
          />

          <div className="relative bg-[#0d1627] border border-white/10 p-6 rounded-xl w-[90%] max-w-sm shadow-2xl">
            {/* HEADER */}
            <div className="flex justify-between items-start mb-4">
              <div>
                <h4 className="text-xl font-semibold text-emerald-50">
                  {confirmModal.product.name}
                </h4>
                <p className="text-sm text-emerald-200 mt-1">
                  Price: ₹{totalPrice(confirmModal.product).toLocaleString()}
                </p>
              </div>

              <button
                className="p-2 rounded-md hover:text-emerald-200 cursor-pointer"
                onClick={() => {
                  closeConfirm();
                  setApplyCash(false);
                }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* INFO BOX */}
            <div className="border border-emerald-700 rounded-lg p-4">
              <p className="text-emerald-200 text-sm leading-relaxed">
                Purchase this product using <strong>full cash payment</strong>.
                <br />
                Reward points will <strong>not be used</strong> for this order.
              </p>

              <div className="mt-3 flex justify-between text-emerald-100 font-semibold">
                <span>Total Payable:</span>
                <span>
                  ₹{totalPrice(confirmModal.product).toLocaleString()}
                </span>
              </div>
            </div>

            {/* PAYMENT OPTIONS */}
            <div className="mt-6 grid gap-3">
              <button
                onClick={() => {
                  setQrModalOpen(true);
                  setConfirmModal({
                    open: true,
                    product: confirmModal.product,
                    mode: "upi",
                  });
                }}
                disabled={processing}
                className={`w-full ${
                  !applyCash
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : "bg-white/10 hover:bg-white/20"
                } py-2 rounded-md font-semibold text-sm flex justify-center items-center gap-2 cursor-pointer`}
              >
                <CreditCard className="w-5 h-5" />
                Pay via UPI
              </button>

              <button
                onClick={() => {
                  setConfirmModal({
                    open: true,
                    product: confirmModal.product,
                    mode: "cash",
                  });
                  setCashApplyVisible(true);
                }}
                disabled={processing}
                className={`w-full ${
                  cashApplyVisible
                    ? "bg-indigo-600 hover:bg-indigo-700"
                    : "bg-white/10 hover:bg-white/20"
                } py-2 rounded-md font-semibold text-sm flex justify-center items-center gap-2 cursor-pointer`}
              >
                <Star className="w-5 h-5" />
                Cash Payment
              </button>

              {cashApplyVisible && (
                <div className="mt-2">
                  <button
                    onClick={handleCashApply}
                    disabled={processing}
                    className="w-full py-2 rounded-md bg-emerald-700 hover:bg-emerald-800 text-white font-semibold"
                  >
                    {processing ? "Processing…" : "Apply for Cash Payment"}
                  </button>

                  <p className="mt-2 text-xs text-emerald-300 text-center">
                    Your order will be recorded as <strong>Cash Pending</strong>
                    . Our team will contact you for collection.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Reward Points Modal */}
      {rewardModal.open && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="" onClick={() => setRewardModal({ open: false })} />

          <div className="bg-[#0d1627] border border-white/10 p-6 rounded-xl w-[90%] max-w-sm shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-emerald-100">
                Confirm Reward Redemption
              </h3>
              <button
                onClick={() => setRewardModal({ open: false })}
                className="text-emerald-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content */}
            <div>
              <p className="text-emerald-200 text-sm mb-3">
                You are redeeming your reward points for:
              </p>

              <h4 className="text-lg text-emerald-50 font-bold mb-2">
                {rewardModal.product.name}
              </h4>

              <div className="bg-emerald-900/20 p-4 rounded-lg border border-emerald-800/30 mb-4">
                <div className="flex justify-between text-emerald-200 text-sm">
                  <span>Total Price:</span>
                  <span>
                    ₹{totalPrice(rewardModal.product).toLocaleString()}
                  </span>
                </div>

                <div className="flex justify-between text-emerald-200 text-sm mt-1">
                  <span>Required Reward Points:</span>
                  <span>{requiredRewardPoints(rewardModal.product)} pts</span>
                </div>

                <div className="flex justify-between text-emerald-200 text-sm mt-1">
                  <span>Your Points:</span>
                  <span>{userPoints} pts</span>
                </div>

                <hr className="my-3 border-emerald-700/30" />

                <div className="flex justify-between text-emerald-100 text-base font-semibold">
                  <span>You Pay:</span>
                  <span>
                    ₹
                    {moneyAfterReward(
                      rewardModal.product,
                      userPoints
                    ).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 justify-end mt-4">
              {/* UPI BUTTON */}
              <button
                onClick={async () => {
                  const product = rewardModal.product;
                  const reqPts = requiredRewardPoints(product);
                  const ptsToUse = (userPoints ?? 0) >= reqPts ? reqPts : 0;
                  const money = moneyAfterReward(product, userPoints);

                  // setRewardModal({ open: false });
                  setQrModalOpen(true); // open QR modal first
                  // setConfirmModal({
                  //   open: false,
                  //   product,
                  //   mode: "upi",
                  // });

                  // actual payment confirm will happen when user clicks "I have paid"
                }}
                disabled={processing}
                className={`w-full flex items-center justify-center gap-2 py-3 px-4 
      rounded-lg bg-emerald-600 hover:bg-emerald-700 
      text-white font-semibold shadow-md transition-all cursor-pointer`}
              >
                <CreditCard className="w-5 h-5" />
                Pay via UPI
              </button>

              {/* CASH BUTTON */}
              <button
                onClick={async () => {
                  const product = rewardModal.product;
                  const reqPts = requiredRewardPoints(product);
                  const ptsToUse = (userPoints ?? 0) >= reqPts ? reqPts : 0;
                  const money = moneyAfterReward(product, userPoints);

                  setRewardModal({ open: false });
                  await finalizeOrder(product, ptsToUse, money, "cash");
                }}
                disabled={processing}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 
      rounded-lg bg-amber-400 hover:bg-amber-500 
      text-black font-semibold shadow-md transition-all cursor-pointer"
              >
                <Star className="w-5 h-5" />
                Pay via Cash
              </button>
            </div>
          </div>
        </div>
      )}
      {/* QR Modal (static QR image + confirm button) */}
      {qrModalOpen && (confirmModal.open || rewardModal.open) && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.85, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="bg-[#0d1627] border border-white/10 p-6 rounded-xl w-[90%] max-w-sm shadow-2xl"
          >
            {/* HEADER */}
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-white">Scan & Pay</h2>
              <X
                className="w-5 h-5 cursor-pointer text-slate-300 hover:text-white"
                onClick={() => setQrModalOpen(false)}
              />
            </div>

            {/* Determine the correct product */}
            {(() => {
              const product = confirmModal.open
                ? confirmModal.product
                : rewardModal.open
                ? rewardModal.product
                : null;

              if (!product) return null;

              return (
                <>
                  {/* QR Code */}
                  <div className="flex flex-col items-center justify-center">
                    <div className="bg-white p-3 rounded-lg shadow-lg">
                      <QRCodeCanvas
                        value={`upi://pay?pa=mrakashsaha102@oksbi&pn=Maintenance Office&am=${totalPrice(
                          product
                        )}&cu=INR&tn=Maintenance Payment`}
                        size={200}
                        bgColor="#ffffff"
                        fgColor="#000000"
                        level="H"
                      />
                    </div>

                    <p className="text-slate-300 text-xs mt-3">
                      Scan using Google Pay / PhonePe / Paytm / BHIM UPI
                    </p>
                  </div>

                  {/* Divider */}
                  <hr className="border-white/10 my-4" />

                  {/* FALLBACK BUTTON */}
                  <button
                    onClick={() => {
                      const UPI_ID = "mrakashsaha102@oksbi";
                      const payeeName = "Maintenance Office";
                      const amount = totalPrice(product);
                      const note = "Maintenance Payment";

                      const upiLink = `upi://pay?pa=${encodeURIComponent(
                        UPI_ID
                      )}&pn=${encodeURIComponent(
                        payeeName
                      )}&am=${amount}&cu=INR&tn=${encodeURIComponent(note)}`;

                      window.location.href = upiLink;
                    }}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 py-2 rounded-md font-semibold text-sm flex justify-center items-center gap-2 text-white"
                  >
                    Pay Using UPI App
                  </button>
                </>
              );
            })()}
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default RecommendedProducts;
