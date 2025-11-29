"use client";

import { useEffect } from "react";
import { auth, firestore } from "@/firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
    doc,
    onSnapshot,
    collection,
    query,
    where,
    getDocs,
    setDoc,
    serverTimestamp,
    updateDoc,
} from "firebase/firestore";
import { computeFeasibility } from "@/lib/computeFeasibility";

// Types matching your data structure
interface RoofTopData {
    rooftop: {
        area: string;
        type: string;
        dwellers: string;
        space: string;
        runOffCoefficient: string;
    };
}

interface City {
    location: {
        city: string;
        lat?: number;
        lng?: number;
    };
}

interface UserData extends RoofTopData, City {
    fullName?: string;
    username?: string;
}

// Helper to convert sqft to m2
function sqftToSqm(sqft: number): number {
    if (!sqft || isNaN(sqft)) return 0;
    return parseFloat((sqft * 0.092903).toFixed(4));
}

// Helper to get coordinates if missing (simple fetch wrapper)
async function getCoordinates(cityName: string) {
    try {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
                cityName
            )}`
        );
        const data = await response.json();
        if (data.length > 0) {
            return {
                lat: parseFloat(data[0].lat),
                lng: parseFloat(data[0].lon),
            };
        }
        return null;
    } catch (err) {
        console.error("Error fetching coordinates:", err);
        return null;
    }
}

export default function FeasibilityUpdater() {
    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
            if (!currentUser) return;

            // Listen to the current user's document
            const userDocRef = doc(firestore, "users", currentUser.uid);
            const unsubscribeUser = onSnapshot(userDocRef, async (snapshot) => {
                if (!snapshot.exists()) return;

                const userData = snapshot.data() as UserData;

                // Check if we have enough data to compute feasibility
                const { rooftop, location } = userData;

                if (
                    !rooftop?.area ||
                    !rooftop?.space ||
                    !rooftop?.dwellers
                ) {
                    // Not enough data yet
                    return;
                }

                try {
                    // 1. Resolve Location
                    let lat = location?.lat;
                    let lng = location?.lng;

                    if ((!lat || !lng) && location?.city) {
                        const coords = await getCoordinates(location.city);
                        if (coords) {
                            lat = coords.lat;
                            lng = coords.lng;
                        }
                    }

                    if (!lat || !lng) return; // Cannot compute without location

                    // 2. Prepare Assessment Data
                    const assessmentInput = {
                        name: userData.fullName || userData.username || "Auto Assessment",
                        location: { lat, lng },
                        dwellers: parseInt(rooftop.dwellers) || 0,
                        roofArea_m2: sqftToSqm(parseFloat(rooftop.area)),
                        openSpace_m2: sqftToSqm(parseFloat(rooftop.space)),
                        roofMaterial: rooftop.type || "concrete",
                        roofSlope_deg: 0, // default
                    };

                    // 3. Find or Create Assessment Document
                    const assessmentsQuery = query(
                        collection(firestore, "assessments"),
                        where("userId", "==", currentUser.uid)
                    );
                    const existingAssessments = await getDocs(assessmentsQuery);

                    let assessmentId: string;
                    let assessmentRef;

                    if (!existingAssessments.empty) {
                        const existingDoc = existingAssessments.docs[0];
                        assessmentId = existingDoc.id;
                        assessmentRef = doc(firestore, "assessments", assessmentId);

                        // Update existing assessment with new inputs
                        await updateDoc(assessmentRef, {
                            ...assessmentInput,
                            updatedAt: serverTimestamp(),
                            status: "processing",
                        });
                    } else {
                        // Create new
                        assessmentRef = doc(collection(firestore, "assessments"));
                        assessmentId = assessmentRef.id;
                        await setDoc(assessmentRef, {
                            ...assessmentInput,
                            userId: currentUser.uid,
                            createdAt: serverTimestamp(),
                            status: "processing",
                        });
                    }

                    // 4. Compute Feasibility
                    const reportOutput = await computeFeasibility({
                        id: assessmentId,
                        ...assessmentInput,
                    });

                    // 5. Save Report
                    const reportRef = doc(firestore, "reports", assessmentId);
                    await setDoc(reportRef, {
                        assessmentId,
                        ...reportOutput,
                    });

                    // 6. Mark Assessment as Done
                    await updateDoc(assessmentRef, {
                        status: "done",
                    });

                    console.log("Feasibility updated automatically in background.");

                } catch (error) {
                    console.error("Error in auto-feasibility update:", error);
                }
            });

            return () => unsubscribeUser();
        });

        return () => unsubscribeAuth();
    }, []);

    // Render nothing
    return null;
}
