/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @next/next/no-img-element */
import React, { useEffect, useState } from "react";
import { Modal } from "@mui/material";
import { motion } from "framer-motion";
import {
  addDoc,
  collection,
  onSnapshot,
  deleteDoc,
  doc,
  updateDoc,
  query,
  orderBy,
  serverTimestamp,
  increment,
} from "firebase/firestore";
import { firestore } from "@/firebase";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/redux/store";
import { closeProductModal, openProductModal } from "@/redux/slices/modalSlice";

type ProductItem = {
  id: string;
  imageUrl?: string;
  name: string;
  description: string;
  price: number;
  quantity: number;
  category: string;
  rewardPoints?: number;
  createdAt?: any;
};

const categories = [
  "Storage Tank",
  "Filter",
  "Recharge",
  "Automation",
  "Accessory",
];

const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

const Product = () => {
  // form fields
  const [category, setCategory] = useState<string>(categories[0]);
  const [name, setName] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [quantity, setQuantity] = useState<string>("0");
  const [price, setPrice] = useState<string>("0");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [loading, setLoading] = useState<boolean>(false);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);

  // search & filters
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [filterBy, setFilterBy] = useState<string>("all");

  // redux modal
  const isOpen = useSelector((s: RootState) => s.modals.productModalIsOpen);
  const dispatch: AppDispatch = useDispatch();

  // admin placeholder: replace with real auth/role check
  const isAdmin = true; // TODO: replace with real role check from auth state

  const PRICE_DEDUCTION_PER_REWARD = 1; // change to whatever you want

  // Add near your other useState calls
  const [modalStep, setModalStep] = useState<number>(1); // 1..3
  const [stepErrors, setStepErrors] = useState<Record<string, string>>({});

  // ---------- Firestore snapshot (ordered) ----------
  useEffect(() => {
    const q = query(
      collection(firestore, "products"),
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(q, (snapshot) => {
      const list: ProductItem[] = snapshot.docs.map((d) => {
        const data = d.data() as Record<string, any>;
        return {
          id: d.id,
          name: data.name ?? "",
          description: data.description ?? "",
          price:
            typeof data.price === "number"
              ? data.price
              : parseFloat(data.price ?? 0),
          quantity:
            typeof data.quantity === "number"
              ? data.quantity
              : parseInt(data.quantity ?? 0),
          imageUrl: data.imageUrl ?? "",
          category: data.category ?? categories[0],
          rewardPoints:
            typeof data.rewardPoints === "number" ? data.rewardPoints : 0,
          createdAt: data.createdAt ?? null,
        };
      });
      setProducts(list);
    });

    return () => unsub();
  }, []);

  // ---------- Reset / pre-fill logic when modal opens ----------
  useEffect(() => {
    if (isOpen) {
      if (!editingId) {
        // opening Add modal -> clear
        setCategory(categories[0]);
        setName("");
        setDescription("");
        setPrice("0");
        setQuantity("0");
        setImageFile(null);
        if (previewUrl) {
          URL.revokeObjectURL(previewUrl);
          setPreviewUrl(null);
        }
      } else {
        // editing -> keep current values (editingId is set in handleEdit)
      }
    } else {
      // modal closed -> ensure editing state cleared
      setEditingId(null);
      // revoke preview if any
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, editingId]);

  // cleanup preview on unmount
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  // ---------- Image handler (preview + revoke) ----------
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    // basic file size/type checks (optional)
    // if (file.size > 5 * 1024 * 1024) return alert("Image too large (max 5MB)");

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setImageFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  // ---------- Edit product (pre-fill) ----------
  const handleEdit = (product: ProductItem) => {
    setEditingId(product.id);
    setName(product.name);
    setDescription(product.description);
    setPrice(product.price?.toString() ?? "0");
    setQuantity(product.quantity?.toString() ?? "0");
    setCategory(product.category ?? categories[0]);
    // if product has an existing imageUrl, show it in preview (not a blob)
    if (product.imageUrl) {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      setPreviewUrl(product.imageUrl);
    } else {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }
    }
    dispatch(openProductModal());
  };

  // ---------- Delete product ----------
  const handleDelete = async (id: string) => {
    // replace with custom confirmation modal in real app
    if (!confirm("Are you sure you want to delete this product?")) return;
    try {
      await deleteDoc(doc(firestore, "products", id));
    } catch (err) {
      console.error("Error deleting product:", err);
      alert("Failed to delete product.");
    }
  };

  // ---------- Add/Update product ----------
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // validation
    const p = parseFloat(price);
    const q = parseInt(quantity, 10);
    if (Number.isNaN(p) || p < 0) {
      return alert("Please enter a valid non-negative price.");
    }
    if (!Number.isInteger(q) || q < 0) {
      return alert("Please enter a valid non-negative quantity.");
    }

    // when adding a new product, require either an image or explicitly allow no image
    if (!editingId && !imageFile) {
      // Allow creation without an image if you want — change this behavior as needed.
      // return alert("Please select an image");
      // we'll allow no image but warn:
      // alert("No image selected; product will be created without an image.");
    }

    setLoading(true);

    try {
      let imageUrl = "";
      // If there's a newly selected file, upload to Cloudinary
      if (imageFile) {
        if (!cloudName || !uploadPreset) {
          throw new Error(
            "Cloudinary not configured. Set NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME and NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET."
          );
        }

        const fd = new FormData();
        fd.append("file", imageFile);
        fd.append("upload_preset", uploadPreset);

        const res = await fetch(
          `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
          {
            method: "POST",
            body: fd,
          }
        );

        if (!res.ok) {
          const text = await res.text();
          throw new Error("Cloudinary upload failed: " + text);
        }
        const data = await res.json();
        imageUrl = data.secure_url;
      }

      if (editingId) {
        const ref = doc(firestore, "products", editingId);
        const updated: Record<string, any> = {
          name,
          description,
          price: p,
          quantity: q,
          category,
        };
        if (imageUrl) updated.imageUrl = imageUrl; // only replace if a new image was uploaded
        await updateDoc(ref, updated);
      } else {
        await addDoc(collection(firestore, "products"), {
          name,
          description,
          price: p,
          quantity: q,
          imageUrl: imageUrl || "",
          category,
          rewardPoints: 0,
          createdAt: serverTimestamp(),
        });
      }

      // cleanup + close
      setEditingId(null);
      setName("");
      setDescription("");
      setPrice("0");
      setQuantity("0");
      setImageFile(null);
      if (previewUrl) {
        // If previewUrl is blob URL, revoke. If it's remote (editing), don't revoke (but we set to null anyway).
        try {
          URL.revokeObjectURL(previewUrl);
        } catch {}
        setPreviewUrl(null);
      }
      dispatch(closeProductModal());
    } catch (err: any) {
      console.error(err);
      alert(err?.message ?? "Error saving product.");
    } finally {
      setLoading(false);
    }
  };

  const resetModal = () => {
    setModalStep(1);
    setEditingId(null);
    setCategory(categories[0]);
    setName("");
    setDescription("");
    setPrice("0");
    setQuantity("0");
    setImageFile(null);
    if (previewUrl) {
      try {
        URL.revokeObjectURL(previewUrl);
      } catch {}
      setPreviewUrl(null);
    }
    setStepErrors({});
  };

  console.log(modalStep);
  const validateCurrentStep = (): boolean => {
    const errs: Record<string, string> = {};
    if (modalStep === 1) {
      if (!name || name.trim().length < 2)
        errs.name = "Please enter a valid product name.";
    }
    if (modalStep === 2) {
      const p = parseFloat(price);
      const q = parseInt(quantity, 10);
      if (Number.isNaN(p) || p < 0)
        errs.price = "Enter a valid non-negative price.";
      if (!Number.isInteger(q) || q < 0)
        errs.quantity = "Enter a valid non-negative quantity.";
      if (!description || description.trim().length < 8)
        errs.description = "Description too short.";
    }
    setStepErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const goToNextStep = () => {
    // if (!validateCurrentStep()) return;
    setModalStep((s) => Math.min(3, s + 1));
    // setModalStep((s) => s + 1);
  };

  // wrapper to call existing handleSubmit then reset modal on success
  const onConfirmSave = async () => {
    // validate final step too (image optional)
    if (!validateCurrentStep()) return;
    // call existing handleSubmit - it will close the modal (dispatch close inside if you kept that behavior)
    try {
      await handleSubmit(new Event("submit") as unknown as React.FormEvent); // safe wrapper to call existing async handleSubmit
      // After successful save, reset local modal state
      resetModal();
    } catch (err) {
      // handleSubmit already alerts on errors; we keep this minimal
      console.log(err);
    }
  };
  // ---------- Reward points (admin only) ----------
  const handleAddReward = async (productId: string, points = 1) => {
    if (!isAdmin) {
      alert("Only admins can add reward points.");
      return;
    }

    try {
      const product = products.find((p) => p.id === productId);
      if (!product) return;

      // Calculate new price
      const newPrice = Math.max(
        0,
        Number(product.price) - PRICE_DEDUCTION_PER_REWARD * points
      );

      const ref = doc(firestore, "products", productId);

      await updateDoc(ref, {
        rewardPoints: increment(points),
        price: newPrice,
      });
    } catch (err) {
      console.error("Error updating reward/price:", err);
      alert("Failed to update reward and price.");
    }
  };

  // ---------- Filtered products ----------
  const filteredProducts = products
    .filter((p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase().trim())
    )
    .filter((p) => {
      if (filterBy === "inStock") return p.quantity > 0;
      if (filterBy === "outOfStock") return p.quantity === 0;
      if (filterBy === "lowPrice") return p.price <= 100;
      if (filterBy === "highPrice") return p.price > 100;
      return true;
    });

  return (
    <div className="relative p-6 pt-4 rounded-2xl bg-white/10 backdrop-blur-md shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap px-4 py-3 mb-4">
        <h2 className="text-xl font-semibold text-sky-300 whitespace-nowrap">
          Product Listings
        </h2>

        <div className="flex items-center gap-3">
          <div className="relative w-64">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              🔍
            </span>
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-white/10 backdrop-blur-md border border-gray-600 text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-400 shadow-md transition"
            />
          </div>

          <div className="relative">
            <select
              value={filterBy}
              onChange={(e) => setFilterBy(e.target.value)}
              className="appearance-none w-44 px-4 py-2 rounded-xl bg-white/10 backdrop-blur-md border border-gray-600 text-gray-200 focus:outline-none focus:ring-2 focus:ring-sky-400 shadow-md transition cursor-pointer"
            >
              <option value="all">All</option>
              <option value="inStock">In Stock</option>
              <option value="outOfStock">Out of Stock</option>
              <option value="lowPrice">Low Price (≤ ₹100)</option>
              <option value="highPrice">High Price (&gt; ₹100)</option>
            </select>
            <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
              ▼
            </span>
          </div>

          <button
            onClick={() => {
              // open Add modal (clear editing state)
              setEditingId(null);
              dispatch(openProductModal());
            }}
            className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white text-sm font-medium rounded-lg shadow cursor-pointer whitespace-nowrap"
          >
            + Add Product
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-gray-700">
        <table className="min-w-full text-sm text-gray-300">
          <thead className="bg-sky-900/40 text-gray-100">
            <tr>
              <th className="px-4 py-3 text-left">Image</th>
              <th className="px-4 py-3 text-left">Product Name</th>
              <th className="px-4 py-3 text-left">Description</th>
              <th className="px-4 py-3 text-left">Price</th>
              <th className="px-4 py-3 text-left">Stock</th>
              <th className="px-4 py-3 text-left">Rewards</th>
              <th className="px-4 py-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {filteredProducts.length > 0 ? (
              filteredProducts.map((prod) => (
                <tr className="hover:bg-gray-800/40" key={prod.id}>
                  <td className="px-4 py-3">
                    <img
                      src={prod.imageUrl || "/placeholder.png"}
                      alt={prod.name}
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                  </td>
                  <td className="px-4 py-3">{prod.name}</td>
                  <td className="px-4 py-3">{prod.description}</td>
                  <td className="px-4 py-3">₹ {prod.price}</td>
                  <td className="px-4 py-3">{prod.quantity}</td>
                  <td className="px-4 py-3">{prod.rewardPoints ?? 0}</td>
                  <td className="px-4 py-3 text-center space-x-2">
                    <button
                      onClick={() => handleEdit(prod)}
                      className="px-3 py-1 text-xs bg-blue-500 hover:bg-blue-600 text-white rounded-lg"
                    >
                      Edit
                    </button>

                    <button
                      onClick={() => handleDelete(prod.id)}
                      className="px-3 py-1 text-xs bg-red-500 hover:bg-red-600 text-white rounded-lg"
                    >
                      Delete
                    </button>

                    {isAdmin && (
                      <button
                        onClick={() => handleAddReward(prod.id, 1)}
                        className="px-3 py-1 text-xs bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg"
                        title="Add 1 reward point"
                      >
                        +1 Reward
                      </button>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={7}
                  className="text-center py-6 text-gray-400 italic"
                >
                  No products found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ------------------ NEW: Multi-step Modern Modal (replace the old Modal block) ------------------ */}
      {/* ------------------ NEW: Multi-step Modern Modal (replace the old Modal block) ------------------ */}
      <Modal
        open={isOpen}
        onClose={() => {
          dispatch(closeProductModal());
          resetModal();
        }}
        aria-labelledby="product-modal-title"
        aria-describedby="product-modal-desc"
      >
        <div className="fixed inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.18 }}
            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 relative"
            role="dialog"
            aria-modal="true"
          >
            {/* Top: title + progress */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2
                  id="product-modal-title"
                  className="text-2xl font-semibold text-sky-700"
                >
                  {editingId ? "Edit Product" : "Add New Product"}
                </h2>
                <p id="product-modal-desc" className="text-sm text-gray-500">
                  {modalStep === 1 && "Select category & basic info"}
                  {modalStep === 2 && "Enter price, quantity & description"}
                  {modalStep === 3 && "Upload photo & confirm"}
                </p>
              </div>

              {/* Step indicator (dots + label) */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  {[1, 2, 3].map((s) => (
                    <div
                      key={s}
                      className={`w-8 h-8 flex items-center justify-center rounded-full text-xs font-medium
                  ${
                    modalStep === s
                      ? "bg-sky-600 text-white"
                      : "bg-gray-200 text-gray-700"
                  }`}
                      aria-current={modalStep === s ? "step" : undefined}
                    >
                      {s}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-gray-100 rounded-full h-2 mb-6 overflow-hidden">
              <div
                className="h-2 bg-sky-500 transition-all"
                style={{ width: `${((modalStep - 1) / 2) * 100}%` }}
              />
            </div>

            {/* Step content area */}
            <form
              // onSubmit={(e) => {
              //   e.preventDefault();
              //   // if last step -> confirm save
              //   if (modalStep < 3) goToNextStep();
              //   else onConfirmSave();
              // }}
              className="space-y-4"
            >
              {/* STEP 1: Category & Name */}
              <div
                aria-hidden={modalStep !== 1}
                className={modalStep === 1 ? "" : "hidden"}
              >
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full border px-3 py-2 rounded-lg"
                  required
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>

                <label className="block text-sm font-medium text-gray-700 mt-4 mb-2">
                  Product name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border px-3 py-2 rounded-lg"
                  placeholder="e.g. 200L Storage Tank"
                  required
                />
                {stepErrors.name && (
                  <p className="text-xs text-red-600 mt-1">{stepErrors.name}</p>
                )}
              </div>

              {/* STEP 2: Description, Price, Quantity */}
              <div
                aria-hidden={modalStep !== 2}
                className={modalStep === 2 ? "" : "hidden"}
              >
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full border px-3 py-2 rounded-lg resize-none"
                  rows={4}
                  placeholder="Short product description..."
                  required
                />

                <div className="grid grid-cols-2 gap-4 mt-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Price (₹)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      className="w-full border px-3 py-2 rounded-lg"
                      required
                    />
                    {stepErrors.price && (
                      <p className="text-xs text-red-600 mt-1">
                        {stepErrors.price}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Quantity
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      className="w-full border px-3 py-2 rounded-lg"
                      required
                    />
                    {stepErrors.quantity && (
                      <p className="text-xs text-red-600 mt-1">
                        {stepErrors.quantity}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* STEP 3: Image Upload & Review */}
              <div
                aria-hidden={modalStep !== 3}
                className={modalStep === 3 ? "" : "hidden"}
              >
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product Photo
                </label>

                <div className="flex items-center gap-3">
                  <input
                    id="wizard-file"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                  <label
                    htmlFor="wizard-file"
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700"
                  >
                    {imageFile ? "Change Photo" : "Upload Photo"}
                  </label>

                  {previewUrl ? (
                    <div className="w-28 h-28 rounded-lg overflow-hidden border">
                      <img
                        src={previewUrl}
                        alt="preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-28 h-28 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 border">
                      No image
                    </div>
                  )}
                </div>

                <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">
                    Review
                  </h4>
                  <div className="text-sm text-gray-600 space-y-1">
                    <div>
                      <strong>Category:</strong> {category}
                    </div>
                    <div>
                      <strong>Name:</strong> {name}
                    </div>
                    <div>
                      <strong>Description:</strong> {description}
                    </div>
                    <div>
                      <strong>Price:</strong> ₹ {price}
                    </div>
                    <div>
                      <strong>Quantity:</strong> {quantity}
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer: navigation buttons */}
              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      dispatch(closeProductModal());
                      resetModal();
                    }}
                    className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setModalStep(1);
                      // quick shortcut to clear form without closing:
                      setCategory(categories[0]);
                      setName("");
                      setDescription("");
                      setPrice("0");
                      setQuantity("0");
                      if (previewUrl) {
                        try {
                          URL.revokeObjectURL(previewUrl);
                        } catch {}
                        setPreviewUrl(null);
                      }
                      setImageFile(null);
                      setStepErrors({});
                    }}
                    className="px-4 py-2 bg-gray-100 text-gray-800 rounded-lg"
                  >
                    Reset
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  {modalStep > 1 && (
                    <button
                      type="button"
                      onClick={() => setModalStep((s) => Math.max(1, s - 1))}
                      className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg"
                    >
                      Back
                    </button>
                  )}

                  {/* Next or Save */}
                  <button
                    type="submit"
                    onClick={(e) => {
                      e.preventDefault()
                      //   // if last step -> confirm save
                        if (modalStep < 3) goToNextStep();
                        else onConfirmSave();
                    }}
                    className={`px-4 py-2 rounded-lg text-white ${
                      modalStep === 3
                        ? "bg-emerald-600 hover:bg-emerald-700"
                        : "bg-sky-600 hover:bg-sky-700"
                    }`}
                  >
                    {modalStep === 3
                      ? loading
                        ? "Saving..."
                        : editingId
                        ? "Update Product"
                        : "Add Product"
                      : "Next"}
                  </button>
                </div>
              </div>
            </form>
          </motion.div>
        </div>
      </Modal>
      {/* ------------------ END Modal replacement ------------------ */}

      {/* ------------------ END Modal replacement ------------------ */}
    </div>
  );
};

export default Product;
