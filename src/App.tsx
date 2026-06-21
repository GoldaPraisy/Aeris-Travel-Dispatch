/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import {
  INITIAL_FLIGHTS,
  INITIAL_HOTELS,
  INITIAL_BOOKINGS,
  INITIAL_REVIEWS,
  INITIAL_RECOMMENDATIONS
} from "./data";
import { Flight, Hotel, Booking, Review, ReviewReply, Recommendation, PriceFreeze, Notification, PricingSeason } from "./types";

// Import Custom Subcomponents
import LiveFlightStatusTrack from "./components/LiveFlightStatusTrack";
import SelectionStudio from "./components/SelectionStudio";
import PricingEngineHub from "./components/PricingEngineHub";
import ClaimsCenter from "./components/ClaimsCenter";
import PersonalizedRecommendations from "./components/PersonalizedRecommendations";
import ReviewsForum from "./components/ReviewsForum";
import Dashboard from "./components/Dashboard";

import {
  Radio,
  Plane,
  Heart,
  TrendingUp,
  X,
  Bell,
  Trash2,
  Calendar,
  Layers,
  HelpCircle,
  Clock,
  Sparkles,
  Award,
  User as UserIcon,
  LogIn,
  ShieldCheck,
  Lock,
  ExternalLink
} from "lucide-react";

import { User, updateProfile } from "firebase/auth";

// Import Firebase Authentication and Firestore real-time syncing mechanisms
import {
  auth,
  db,
  googleProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  collection,
  doc,
  setDoc,
  getDoc,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  onSnapshot,
  updateDoc,
  deleteDoc,
  handleFirestoreError,
  OperationType
} from "./firebase";

export default function App() {
  // Global App States maintaining all unified datastores
  const [flights, setFlights] = useState<Flight[]>(INITIAL_FLIGHTS);
  const [hotels, setHotels] = useState<Hotel[]>(INITIAL_HOTELS);
  const [bookings, setBookings] = useState<Booking[]>(INITIAL_BOOKINGS);
  const [reviews, setReviews] = useState<Review[]>(INITIAL_REVIEWS);
  const [recommendations, setRecommendations] = useState<Recommendation[]>(INITIAL_RECOMMENDATIONS);
  const [priceFreezes, setPriceFreezes] = useState<PriceFreeze[]>([]);
  const [pricingSeason, setPricingSeason] = useState<PricingSeason>("standard");

  // User Authenticated State
  const [user, setUser] = useState<User | null>(null);
  
  // Auth Modal States
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authTab, setAuthTab] = useState<"login" | "signup">("login");
  const [authUsername, setAuthUsername] = useState<string>("");
  const [authEmail, setAuthEmail] = useState<string>("");
  const [authPassword, setAuthPassword] = useState<string>("");
  const [authConfirmPassword, setAuthConfirmPassword] = useState<string>("");
  const [authError, setAuthError] = useState<string>("");
  const [authLoading, setAuthLoading] = useState<boolean>(false);

  // Notifications/Toasts System State
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: "nt-1",
      title: "Avionics Grid Synchronized",
      message: "Telemetry streams active for Charles De Gaulle (CDG) & Narita (NRT) corridors.",
      timestamp: "11:22",
      type: "success",
      read: false
    },
    {
      id: "nt-2",
      title: "Advisory: Global Tariffs Standardized",
      message: "Dynamic pricing engine normalized to catalog base weights.",
      timestamp: "11:20",
      type: "info",
      read: false
    }
  ]);
  const [isAlertMenuOpen, setIsAlertMenuOpen] = useState<boolean>(false);

  // Active Main Pane Tab
  const [activeTab, setActiveTab] = useState<"dashboard" | "avionics" | "economics" | "preferences" | "claims" | "recommendations" | "forum">("dashboard");

  // Push notifications generator helper
  const triggerNotification = (
    title: string,
    message: string,
    type: "info" | "alert" | "success" | "warning" = "info"
  ) => {
    const formattedTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const nextAlert: Notification = {
      id: `nt-${Date.now()}`,
      title,
      message,
      timestamp: formattedTime,
      type,
      read: false
    };
    setNotifications((prev) => [nextAlert, ...prev]);
  };

  // -------------------------------------------------------------
  // REAL-TIME WORLDWIDE FLIGHT ROUTE API SYNCHRONIZATION
  // -------------------------------------------------------------
  useEffect(() => {
    const fetchLiveFlightsByRoute = async () => {
      try {
        const res = await fetch("/api/flights/live");
        if (res.ok) {
          const data = await res.json();
          if (data.flights && data.flights.length > 0) {
            setFlights(data.flights);
            triggerNotification(
              "Worldwide Telemetry Sync",
              `Acquired ${data.flights.length} real-time active flight vectors from international satellite corridors (${data.source === "live-api" ? "OpenSky Network Active Feed" : "Secure System Cached Catalog"}).`,
              "success"
            );
          }
        }
      } catch (err) {
        console.warn("Could not sync live flight coordinates, running defaults:", err);
      }
    };

    fetchLiveFlightsByRoute();
    // Poll for update every 30 seconds to maintain high fidelity live feed
    const pollInterval = setInterval(fetchLiveFlightsByRoute, 30000);
    return () => clearInterval(pollInterval);
  }, []);

  // -----------------------------------------------------------------
  // FIREBASE USER AUTH & DB SYNC LOOPS
  // -----------------------------------------------------------------
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        setIsAuthModalOpen(false);
        triggerNotification(
          "Cloud Link Secured",
          `Authenticated credentials validated for ${currentUser.email}. Synchronizing reservations ledger.`,
          "success"
        );
      } else {
        triggerNotification(
          "Sandbox Mode Active",
          "Working offline. Sign in to synchronize parameters with the secure cloud ledger.",
          "info"
        );
      }
    });
    return () => unsubscribe();
  }, []);

  // 1. Real-time Reviews Firestore Syncer (Global reviews feed)
  useEffect(() => {
    const q = query(collection(db, "reviews"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const dbReviews: Review[] = [];
      snapshot.forEach((docSnap) => {
        const item = docSnap.data();
        dbReviews.push({
          id: docSnap.id,
          targetId: item.targetId,
          targetType: item.targetType,
          author: item.author,
          stars: item.stars,
          text: item.text,
          photos: item.photos || [],
          createdAt: item.createdAt,
          helpfulCount: item.helpfulCount || 0,
          flagged: item.flagged || false,
          replies: item.replies || [],
        });
      });

      if (dbReviews.length > 0) {
        setReviews(dbReviews);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, "reviews");
    });

    return () => unsubscribe();
  }, [user]);

  // 2. Personal Bookings Real-time Syncer (Bound to User UID)
  useEffect(() => {
    if (!user) {
      setBookings(INITIAL_BOOKINGS);
      return;
    }

    const path = `users/${user.uid}/bookings`;
    const q = collection(db, path);

    const syncUserBookings = async () => {
      try {
        const querySnapshot = await getDocs(q);
        if (querySnapshot.empty) {
          // Initialize empty cloud user database with high quality template bookings
          console.log("Initalizing user cloud registry with template records.");
          for (const item of INITIAL_BOOKINGS) {
            await setDoc(doc(db, path, item.id), item);
          }
        } else {
          const cloudBookings: Booking[] = [];
          querySnapshot.forEach((docSnap) => {
            cloudBookings.push(docSnap.data() as Booking);
          });
          setBookings(cloudBookings);
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.LIST, path);
      }
    };

    syncUserBookings();

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const liveList: Booking[] = [];
      snapshot.forEach((snap) => {
        liveList.push(snap.data() as Booking);
      });
      if (liveList.length > 0) {
        setBookings(liveList);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    });

    return () => unsubscribe();
  }, [user]);

  // Auth Operations Handlers
  const handleEmailAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setAuthLoading(true);

    try {
      if (authTab === "login") {
        await signInWithEmailAndPassword(auth, authEmail, authPassword);
      } else {
        if (!authUsername.trim()) {
          throw new Error("Username is required.");
        }
        if (authPassword !== authConfirmPassword) {
          throw new Error("Passwords do not match.");
        }
        const userCredential = await createUserWithEmailAndPassword(auth, authEmail, authPassword);
        if (userCredential.user) {
          await updateProfile(userCredential.user, {
            displayName: authUsername.trim()
          });
          setUser({
            ...userCredential.user,
            displayName: authUsername.trim()
          } as User);
        }
      }
      setIsAuthModalOpen(false);
      setAuthEmail("");
      setAuthPassword("");
      setAuthUsername("");
      setAuthConfirmPassword("");
    } catch (err: any) {
      console.error(err);
      if (err.code === "auth/operation-not-allowed") {
        setAuthError(
          `EMAIL & PASSWORD SIGNUP IS DISABLED (auth/operation-not-allowed). To enable this:\n\n1. Go to your Firebase Console\n2. Navigate to Authentication -> Sign-in Method\n3. Click 'Add new provider'\n4. Select 'Email/Password', toggle the Enable switch, and click Save.\n\nAlternatively, you can synchronize using google auth instead.`
        );
      } else {
        setAuthError(err.message || "An authentication error occurred. Please verify inputs.");
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setAuthError("");
    setAuthLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
      setIsAuthModalOpen(false);
    } catch (err: any) {
      console.error("Authenticated SSO failure:", err);
      const isPopupClosed = err?.code === "auth/popup-closed-by-user" || 
                            err?.message?.includes("popup-closed-by-user") ||
                            err?.message?.includes("cancelled-by-user");
      
      const errorCode = err?.code || "";
      const errorMessage = err?.message || "";

      if (isPopupClosed) {
        setAuthError("Sign-in popup was closed by the user. Please keep the popup window open until sign-in completes.");
        triggerNotification(
          "Sync Suspended",
          "Continuous cloud sync flow cancelled by passenger.",
          "info"
        );
      } else if (errorCode === "auth/unauthorized-domain") {
        setAuthError(
          `UNAUTHORIZED DOMAIN (${errorCode}): This web URL is not authorized on your Firebase project yet. To fix this:\n\n1. Open your Firebase Console\n2. Go to Authentication -> Settings -> Authorized Domains\n3. Add these two domains:\n\n• ais-dev-7kqi5tvrqrvwwthp4i5jgk-967647800785.europe-west2.run.app\n• ais-pre-7kqi5tvrqrvwwthp4i5jgk-967647800785.europe-west2.run.app`
        );
        triggerNotification("Domain Unauthorized", "Please add the app container domain to Firebase Auth Settings.", "alert");
      } else if (errorCode === "auth/operation-not-allowed") {
        setAuthError(
          `GOOGLE SIGN-IN DISABLED (${errorCode}): Google Auth is not enabled. To fix this:\n\n1. Open your Firebase Console\n2. Go to Authentication -> Sign-in Method\n3. Click 'Add new provider'\n4. Select 'Google', enable it, fill in your project support email, and save.`
        );
        triggerNotification("Provider Disabled", "Google Auth is disabled in your Firebase console.", "alert");
      } else if (errorCode === "auth/popup-blocked") {
        setAuthError(
          `POPUP BLOCKED (${errorCode}): Your browser blocked the authentication popup. Please allow popups for this site, or open this application in a new separate tab instead.`
        );
        triggerNotification("Popup Blocked", "Please allow popups to proceed with Google authentication.", "warning");
      } else if (errorCode === "auth/network-request-failed" || errorCode.includes("cookie") || errorMessage.includes("cookie")) {
        setAuthError(
          `THIRD-PARTY COOKIE OR NETWORK FAULT (${errorCode || "Storage Restricted"}): Third-party cookies may be blocked inside the AI Studio playground iframe.\n\nTo resolve this instantly:\n1. Use the 'Create Account' tab below with email/password instead (fully supported offline & online!)\n2. Or, open this application in a new tab using the 'Open in sub-tab' option.`
        );
        triggerNotification("Iframe Sync Restrained", "Browser third-party cookie configuration restriction detected.", "warning");
      } else {
        setAuthError(
          `AUTHENTICATION FAULT [${errorCode}]: ${errorMessage}\n\nTroubleshooting suggestions:\n• Ensure Google Sign-In is enabled in the Firebase console.\n• Verify authorized domains are configured.\n• Alternatively, use the 'Create Account' tab below to sync via Email & Password.`
        );
        triggerNotification("SSO Link Rejected", err.message || "Google single sign-on rejected.", "alert");
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setBookings(INITIAL_BOOKINGS);
      setActiveTab("dashboard");
    } catch (err) {
      console.error("Sign out failure:", err);
    }
  };

  // Callback 1: Save Seat or Room Preferences from Selection Studio
  const handleSavePreferences = async (
    bookingId: string,
    itemType: "seat" | "room",
    value: string,
    priceDelta: number
  ) => {
    const updatedDetail =
      itemType === "seat"
        ? `Seat ${value} (${bookings.find(b => b.id === bookingId)?.detail.includes("Deluxe") ? "Deluxe Room" : "Standard Class"})`
        : `Room Upgrade: ${value} (Locked ${bookings.find(b => b.id === bookingId)?.seatSelection ? `with seat ${bookings.find(b => b.id === bookingId)?.seatSelection}` : ""})`;

    const updatedList = bookings.map((bk) => {
      if (bk.id !== bookingId) return bk;
      return {
        ...bk,
        detail: updatedDetail,
        amountPaid: bk.originalPrice + priceDelta,
        seatSelection: itemType === "seat" ? value : bk.seatSelection,
        roomSelection: itemType === "room" ? value : bk.roomSelection
      };
    });

    setBookings(updatedList);

    if (user) {
      try {
        const targetBooking = updatedList.find(b => b.id === bookingId);
        if (targetBooking) {
          const bookingRef = doc(db, "users", user.uid, "bookings", bookingId);
          await setDoc(bookingRef, targetBooking);
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}/bookings/${bookingId}`);
      }
    }
  };

  // Callback 3: Price Freeze mechanism
  const handleAddPriceFreeze = (freeze: Omit<PriceFreeze, "id" | "expiresAt">) => {
    const expiresAt = Date.now() + 15 * 60 * 1000; // 15 mins
    const newFreeze: PriceFreeze = {
      ...freeze,
      id: `fz-${Date.now()}`,
      expiresAt
    };
    setPriceFreezes((prev) => [newFreeze, ...prev]);
  };

  const handleRemovePriceFreeze = (id: string) => {
    setPriceFreezes((prev) => prev.filter((f) => f.id !== id));
  };

  // Instantiate Booking directly from structured price lock!
  const handleCreateBookingFromFreeze = async (freeze: PriceFreeze) => {
    const newBookingId = `bk-${Date.now().toString().slice(-4)}`;
    const newBooking: Booking = {
      id: newBookingId,
      type: freeze.type,
      targetId: freeze.targetId,
      title: `${freeze.title} (Locked Fee)`,
      detail: freeze.type === "flight" ? "Seat Unassigned (Locked Rate)" : "Standard Suite Allotment (Locked Rate)",
      amountPaid: freeze.frozenPrice,
      bookingTime: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString(),
      status: "active",
      refundStatus: "none",
      originalPrice: freeze.frozenPrice
    };

    const nextBookings = [newBooking, ...bookings];
    setBookings(nextBookings);
    setPriceFreezes((prev) => prev.filter((f) => f.id !== freeze.id));

    if (user) {
      try {
        const bookingRef = doc(db, "users", user.uid, "bookings", newBookingId);
        await setDoc(bookingRef, newBooking);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}/bookings/${newBookingId}`);
      }
    }

    triggerNotification(
      "Price Lock Honored",
      `Dynamic pricing frozen booking initialized as Reservation #${newBookingId} at guaranteed level of $${freeze.frozenPrice} USD.`,
      "success"
    );
  };

  // Callback 4: Revocation / Cancellation submission
  const handleCancelBooking = async (bookingId: string, reason: string, refundAmount: number, timeline: string) => {
    const updatedList = bookings.map((bk) => {
      if (bk.id !== bookingId) return bk;
      return {
        ...bk,
        status: "pending_refund" as const,
        cancellationReason: reason,
        refundAmount,
        refundStatus: "pending" as const,
        expectedRefundTime: timeline,
        updatedAt: new Date().toISOString()
      };
    });

    setBookings(updatedList);

    if (user) {
      try {
        const targetBooking = updatedList.find(b => b.id === bookingId);
        if (targetBooking) {
          const bookingRef = doc(db, "users", user.uid, "bookings", bookingId);
          await setDoc(bookingRef, targetBooking);
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}/bookings/${bookingId}`);
      }
    }

    // After 10s, auto transition status from "pending" to "processed" to show a realistic timeline system
    setTimeout(async () => {
      const processedList = bookings.map((bk) => {
        if (bk.id !== bookingId) return bk;
        return {
          ...bk,
          status: "refunded" as const,
          refundStatus: "processed" as const,
          expectedRefundTime: "Processed via Dedicated Transaction Corridor"
        };
      });

      setBookings(processedList);

      if (user) {
        try {
          const targetBooking = processedList.find(b => b.id === bookingId);
          if (targetBooking) {
            const bookingRef = doc(db, "users", user.uid, "bookings", bookingId);
            await setDoc(bookingRef, targetBooking);
          }
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}/bookings/${bookingId}`);
        }
      }

      triggerNotification(
        "Refund Authorized",
        `Refund for Revocation Claim #${bookingId} has processed successfully. Expected clearing window: 24h.`,
        "success"
      );
    }, 12000);
  };

  // Callback 5: Recommendation Feedback Loops
  const handleVoteRecommendation = (id: string, helpful: boolean) => {
    setRecommendations((prev) =>
      prev.map((rec) => {
        if (rec.id !== id) return rec;
        return { ...rec, helpful };
      })
    );
  };

  // Refresh recommendation matches based on the category active signal!
  const handleRefreshRecommendations = (category: string) => {
    if (category === "beaches") {
      setRecommendations([
        {
          id: "rc-1",
          targetType: "hotel",
          targetId: "ht-2",
          title: "Ryokan Kasumi (Kyoto Oasis)",
          subtitle: "Eco Thermal Springrest",
          reason: "Matches your historical Rest-scores in rural Kyoto gardens.",
          matchPercentage: 98,
          price: 280,
          whyTooltip: "Custom weighted match algorithm detected user feedback alignment with local mist-scenery, thermal basalt tubs, and custom yukatas.",
          helpful: null
        },
        {
          id: "rc-tropical",
          targetType: "hotel",
          targetId: "ht-1",
          title: "Bora Bora Lagoon Retreat",
          subtitle: "Lagoon Deep Reef Cabanas",
          reason: "Because you liked tropical locations with private balconies!",
          matchPercentage: 92,
          price: 490,
          whyTooltip: "Based on heavy recommendation patterns correlating Champs-Elysees premium tea service and coastal French Polynesian exclusive cabanas.",
          helpful: null
        },
        {
          id: "rc-bali",
          targetType: "flight",
          targetId: "fl-4",
          title: "Direct Flight ➔ Bali (DPS)",
          subtitle: "Direct Equatorial Flight Route",
          reason: "Because you like beaches! Over 4 historical logs detect Bali preference.",
          matchPercentage: 89,
          price: 720,
          whyTooltip: "Analyzed your travel registry files, pairing standard off-season rates with your preference for beaches, triggering Bali suggestions.",
          helpful: null
        }
      ]);
    } else if (category === "history") {
      setRecommendations([
        {
          id: "rc-1",
          targetType: "hotel",
          targetId: "ht-2",
          title: "Ryokan Kasumi (Kyoto Oasis)",
          subtitle: "Eco Thermal Springrest",
          reason: "Classic Kyoto architecture. Rated 5 stars by travelers with identical heritage scores.",
          matchPercentage: 99,
          price: 280,
          whyTooltip: "Collaborative match using vectors for historically preserved cedar structures and local high-grade matcha culinary packages.",
          helpful: null
        },
        {
          id: "rc-history-paris",
          targetType: "hotel",
          targetId: "ht-1",
          title: "The Vermilion Atelier & Suites",
          subtitle: "Parisian Restoration Masterpiece",
          reason: "Because you appreciate historic 19th-century masonry and velvet design.",
          matchPercentage: 94,
          price: 350,
          whyTooltip: "Historical heritage filters pair this Champs-Élysées layout with travelers booking historical museums and classical tours nearby.",
          helpful: null
        },
        {
          id: "rc_history_fly",
          targetType: "flight",
          targetId: "fl-3",
          title: "Lufthansa FRA ➔ ORD Route",
          subtitle: "Transatlantic Classic Corridor",
          reason: "Historical travel records indicate frequent direct flights near central European capitals.",
          matchPercentage: 85,
          price: 710,
          whyTooltip: "Synthesized matching with classic Boeing rosters that operate low air-congestion corridors across western Germany and Chicago gateways.",
          helpful: null
        }
      ]);
    } else if (category === "modern") {
      setRecommendations([
        {
          id: "rc-3",
          targetType: "hotel",
          targetId: "ht-3",
          title: "The Obsidian Harbor Tower",
          subtitle: "Sleek SF Monolithic Skyscraper",
          reason: "Matches your liking for modern glass-steel brutalist skyscrapers.",
          matchPercentage: 97,
          price: 220,
          whyTooltip: "Matched against traveler models who highly rate automated biometric sensors, in-room espresso bars, and high-contrast charcoal finishes.",
          helpful: null
        },
        {
          id: "rc-modern-tokyo",
          targetType: "flight",
          targetId: "fl-2",
          title: "United Airlines SFO Direct Tokyo",
          subtitle: "Pacific Express Corridor",
          reason: "Perfect matching with high-tech metropolitan hubs in Tokyo and San Francisco.",
          matchPercentage: 93,
          price: 840,
          whyTooltip: "Direct flight corridor coordinates calculated for business executives booking within central metropolitan technological sectors.",
          helpful: null
        }
      ]);
    }
  };

  // Callback 6: Add Review
  const handleAddReview = async (newReviewData: Omit<Review, "id" | "createdAt" | "helpfulCount" | "flagged" | "replies">) => {
    if (user) {
      try {
        await addDoc(collection(db, "reviews"), {
          ...newReviewData,
          createdAt: new Date().toISOString(),
          helpfulCount: 0,
          flagged: false,
          replies: []
        });
        triggerNotification("Review Published", "Your rating was committed to the cloud database registry.", "success");
      } catch (err) {
         handleFirestoreError(err, OperationType.CREATE, "reviews");
      }
    } else {
      const nextReview: Review = {
        ...newReviewData,
        id: `rv-${Date.now()}`,
        createdAt: new Date().toISOString(),
        helpfulCount: 0,
        flagged: false,
        replies: []
      };
      setReviews((prev) => [nextReview, ...prev]);
      triggerNotification("Review Cached Locally", "Working offline. Sign in to post globally in real-time.", "warning");
    }
  };

  // Add Comment/Reply to Review
  const handleAddReply = async (reviewId: string, replyText: string) => {
    const nextReply: ReviewReply = {
      id: `rp-${Date.now()}`,
      author: user ? user.email?.split("@")[0] || "Authorized Agent" : "Resident Dispatcher",
      text: replyText,
      createdAt: new Date().toISOString()
    };

    if (user && !reviewId.startsWith("rv-")) {
      try {
        const reviewRef = doc(db, "reviews", reviewId);
        const foundReview = reviews.find(r => r.id === reviewId);
        if (foundReview) {
          await updateDoc(reviewRef, {
            replies: [...foundReview.replies, nextReply]
          });
          triggerNotification("Comment Registered", "Representative reply appended to global reviews.", "success");
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `reviews/${reviewId}`);
      }
    } else {
      setReviews((prev) =>
        prev.map((r) => {
          if (r.id !== reviewId) return r;
          return {
            ...r,
            replies: [...r.replies, nextReply]
          };
        })
      );
    }
  };

  const handleFlagReview = async (reviewId: string) => {
    if (user && !reviewId.startsWith("rv-")) {
      try {
        await updateDoc(doc(db, "reviews", reviewId), { flagged: true });
        triggerNotification("Flag Registered", "Audit ticket generated for moderation queue review.", "alert");
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `reviews/${reviewId}`);
      }
    } else {
      setReviews((prev) =>
        prev.map((r) => {
          if (r.id !== reviewId) return r;
          return { ...r, flagged: true };
        })
      );
    }
  };

  const handleHelpfulVote = async (reviewId: string) => {
    const target = reviews.find(r => r.id === reviewId);
    if (!target) return;

    if (user && !reviewId.startsWith("rv-")) {
      try {
        await updateDoc(doc(db, "reviews", reviewId), {
          helpfulCount: (target.helpfulCount || 0) + 1
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `reviews/${reviewId}`);
      }
    } else {
      setReviews((prev) =>
        prev.map((r) => {
          if (r.id !== reviewId) return r;
          return {
            ...r,
            helpfulCount: r.helpfulCount + 1,
            votedHelpful: true
          };
        })
      );
    }
  };

  const handleModerateReview = async (reviewId: string, action: "approve" | "delete") => {
    if (user && !reviewId.startsWith("rv-")) {
      try {
        if (action === "delete") {
          await deleteDoc(doc(db, "reviews", reviewId));
        } else {
          await updateDoc(doc(db, "reviews", reviewId), { flagged: false });
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `reviews/${reviewId}`);
      }
    } else {
      if (action === "delete") {
        setReviews((prev) => prev.filter((r) => r.id !== reviewId));
      } else {
        setReviews((prev) =>
          prev.map((r) => {
            if (r.id !== reviewId) return r;
            return { ...r, flagged: false };
          })
        );
      }
    }
  };

  // Format active prices taking season factor into account for preview listings
  const getSeasonModifier = () => {
    switch (pricingSeason) {
      case "peak": return 1.15;
      case "holiday": return 1.20;
      case "offpeak": return 0.85;
      default: return 1.0;
    }
  };
  const mod = getSeasonModifier();

  return (
    <div className="min-h-screen bg-canvas text-typography flex flex-col justify-between" id="app-root">
      {/* Top Ledger Header */}
      <header className="border-b border-border-grid bg-panel z-10 sticky top-0 animate-fade" id="main-header">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Logo / Brand Pairing */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 border border-accent flex items-center justify-center bg-accent/5">
              <Radio className="text-accent animate-pulse" size={20} />
            </div>
            <div>
              <span className="font-serif italic font-extrabold text-xl tracking-tight text-typography">
                Aeris Travel <span className="text-accent italic">Dispatch</span>
              </span>
              <span className="font-mono text-[9px] block text-gray-500 tracking-widest mt-0.5">
                SECURE AVIONICS & BOOKINGS RECORD LEDGER
              </span>
            </div>
          </div>

          {/* Quick Metrics Bar (Monospace Desktop View) */}
          <div className="hidden lg:flex items-center gap-6 font-mono text-[10px] text-gray-500">
            <div className="border-r border-border-grid pr-6">
              <span className="block uppercase text-gray-600">Avionics Feed</span>
              {user ? (
                <span className="text-emerald-400 font-semibold block mt-0.5 uppercase flex items-center gap-1">
                  <ShieldCheck size={11} /> CLOUD SYSTEM BACKUP ACTIVE
                </span>
              ) : (
                <span className="text-amber-500 font-semibold block mt-0.5 uppercase">
                  ● LOCAL WORKSTATION ONLY
                </span>
              )}
            </div>
            <div className="border-r border-border-grid pr-6">
              <span className="block uppercase text-gray-600">Season Index</span>
              <span className="text-accent font-semibold block mt-0.5 uppercase">
                {pricingSeason} (x{mod.toFixed(2)})
              </span>
            </div>
            <div>
              <span className="block uppercase text-gray-600">Active Holds</span>
              <span className="text-typography font-bold block mt-0.5">
                {bookings.filter((b) => b.status === "active").length} Tracks held
              </span>
            </div>
          </div>

          {/* Action Systems triggers (Auth & Notifications) */}
          <div className="flex items-center gap-3">
            {/* User Session Controller */}
            {user ? (
              <div className="flex items-center gap-2 border border-border-grid p-1.5 bg-[#121212]">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse hidden sm:inline-block" />
                <span className="font-mono text-[9px] text-gray-300 max-w-[110px] truncate block" title={user.email || ""}>
                  {user.email}
                </span>
                <button
                  id="signout-terminal-btn"
                  onClick={handleSignOut}
                  className="px-2 py-1 bg-red-950/40 border border-red-900/40 hover:bg-red-900/30 text-red-400 font-mono text-[9px] uppercase tracking-wider transition-all cursor-pointer"
                >
                  Exit Ledger
                </button>
              </div>
            ) : (
              <button
                id="signin-terminal-btn"
                onClick={() => {
                  setAuthError("");
                  setIsAuthModalOpen(true);
                }}
                className="p-2 border border-accent/40 bg-accent/5 hover:bg-accent/15 transition-all text-[10px] font-mono text-accent uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
              >
                <UserIcon size={12} />
                <span>Sync Account Ledger</span>
              </button>
            )}

            <div className="relative">
              <button
                id="alert-notifications-trigger"
                onClick={() => setIsAlertMenuOpen(!isAlertMenuOpen)}
                className="p-2 border border-border-grid bg-[#161616] hover:border-gray-500 text-typography transition-all relative flex items-center gap-1.5 cursor-pointer"
              >
                <Bell size={16} className={notifications.some(n => !n.read) ? "animate-swing text-accent" : ""} />
                <span className="font-mono text-xs hidden sm:inline">Dispatch Logs</span>
                {notifications.length > 0 && (
                  <span className="w-4 h-4 bg-accent text-canvas font-mono font-bold text-[9px] rounded-none flex items-center justify-center absolute -top-1.5 -right-1.5 shadow-md shadow-accent/20">
                    {notifications.length}
                  </span>
                )}
              </button>

              {/* Notification Drawer Popover */}
              {isAlertMenuOpen && (
                <div
                  id="alert-popover-box"
                  className="absolute right-0 mt-2 w-80 bg-[#141414] border border-border-grid z-50 p-4 shadow-xl text-xs"
                >
                  <div className="flex justify-between items-center border-b border-border-grid pb-2.5 mb-2.5">
                    <span className="font-serif italic font-bold text-typography text-sm">Push Alerts Log</span>
                    <button
                      id="clear-notifications-btn"
                      onClick={() => setNotifications([])}
                      className="font-mono text-[9px] uppercase text-gray-500 hover:text-white flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 size={10} /> Clear
                    </button>
                  </div>

                  <div className="flex flex-col gap-2 max-h-64 overflow-y-auto pr-1">
                    {notifications.length > 0 ? (
                      notifications.map((note) => (
                        <div
                          key={note.id}
                          className={`p-2 bg-panel border flex flex-col gap-1 ${
                            note.type === "alert"
                              ? "border-red-950 bg-[#251010]/30"
                              : note.type === "success"
                              ? "border-emerald-950/20 bg-emerald-950/10"
                              : note.type === "warning"
                              ? "border-amber-900/40 bg-[#2D1B13]/30"
                              : "border-border-grid"
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <span className="font-mono font-bold text-[10px] text-typography leading-none">
                              {note.title}
                            </span>
                            <span className="font-mono text-[8px] text-gray-500">{note.timestamp}</span>
                          </div>
                          <p className="font-sans text-[11px] text-gray-400 leading-normal">{note.message}</p>
                        </div>
                      ))
                    ) : (
                      <div className="text-gray-500 italic text-center py-4">No alarms actively logged in corridor.</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Grid Workspace */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex flex-col gap-8">
        {/* Active Grid Banner Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4" id="stats-banner-row">
          <div className="border border-border-grid bg-panel p-4 flex flex-col justify-between" style={{ fontFamily: "var(--font-mono)" }}>
            <span className="text-[9px] text-gray-500 block uppercase">Active Flight Vectors</span>
            <span className="text-xl font-bold text-accent mt-0.5">{flights.length} Registered</span>
          </div>
          <div className="border border-border-grid bg-panel p-4 flex flex-col justify-between" style={{ fontFamily: "var(--font-mono)" }}>
            <span className="text-[9px] text-gray-500 block uppercase">Hotel Room Inventories</span>
            <span className="text-xl font-bold text-typography mt-0.5">{hotels.reduce((sum, h) => sum + h.roomsAvailable, 0)} Options</span>
          </div>
          <div className="border border-border-grid bg-panel p-4 flex flex-col justify-between" style={{ fontFamily: "var(--font-mono)" }}>
            <span className="text-[9px] text-gray-500 block uppercase">Active Price Locks</span>
            <span className="text-xl font-bold text-typography mt-0.5">{priceFreezes.length} Shields</span>
          </div>
          <div className="border border-border-grid bg-panel p-4 flex flex-col justify-between" style={{ fontFamily: "var(--font-mono)" }}>
            <span className="text-[9px] text-gray-500 block uppercase">Database Status</span>
            <span className={`text-xl font-bold mt-0.5 flex items-center gap-1 ${user ? "text-emerald-400" : "text-gray-400"}`}>
              {user ? "Cloud Synced" : "Local Sandbox"}
            </span>
          </div>
        </div>

        {/* Tactical Ledger Navigation Bar */}
        <div className="border-b border-border-grid flex flex-wrap gap-1 bg-[#121212] p-1.5 animate-fade" id="tactical-navbar">
          <button
            id="tab-btn-dashboard"
            onClick={() => setActiveTab("dashboard")}
            className={`py-2 px-4 transition-all text-xs font-mono uppercase tracking-wider cursor-pointer ${
              activeTab === "dashboard"
                ? "bg-accent text-canvas font-bold shadow-md"
                : "text-gray-400 hover:text-white hover:bg-[#1C1C1C]"
            }`}
          >
            Ledger Dashboard
          </button>
          <button
            id="tab-btn-avionics"
            onClick={() => setActiveTab("avionics")}
            className={`py-2 px-4 transition-all text-xs font-mono uppercase tracking-wider cursor-pointer ${
              activeTab === "avionics"
                ? "bg-accent text-canvas font-bold shadow-md"
                : "text-gray-400 hover:text-white hover:bg-[#1C1C1C]"
            }`}
          >
            Terminal Telemetry
          </button>
          <button
            id="tab-btn-economics"
            onClick={() => setActiveTab("economics")}
            className={`py-2 px-4 transition-all text-xs font-mono uppercase tracking-wider cursor-pointer ${
              activeTab === "economics"
                ? "bg-accent text-canvas font-bold shadow-md"
                : "text-gray-400 hover:text-white hover:bg-[#1C1C1C]"
            }`}
          >
            Economic Engine
          </button>
          <button
            id="tab-btn-preferences"
            onClick={() => setActiveTab("preferences")}
            className={`py-2 px-4 transition-all text-xs font-mono uppercase tracking-wider cursor-pointer ${
              activeTab === "preferences"
                ? "bg-accent text-canvas font-bold shadow-md"
                : "text-gray-400 hover:text-white hover:bg-[#1C1C1C]"
            }`}
          >
            Configuration Studio
          </button>
          <button
            id="tab-btn-claims"
            onClick={() => setActiveTab("claims")}
            className={`py-2 px-4 transition-all text-xs font-mono uppercase tracking-wider cursor-pointer ${
              activeTab === "claims"
                ? "bg-accent text-canvas font-bold shadow-md"
                : "text-gray-400 hover:text-white hover:bg-[#1C1C1C]"
            }`}
          >
            Revocation & Refunds
          </button>
          <button
            id="tab-btn-recommendations"
            onClick={() => setActiveTab("recommendations")}
            className={`py-2 px-4 transition-all text-xs font-mono uppercase tracking-wider cursor-pointer ${
              activeTab === "recommendations"
                ? "bg-accent text-canvas font-bold shadow-md"
                : "text-gray-400 hover:text-white hover:bg-[#1C1C1C]"
            }`}
          >
            AI Affinities
          </button>
          <button
            id="tab-btn-forum"
            onClick={() => setActiveTab("forum")}
            className={`py-2 px-4 transition-all text-xs font-mono uppercase tracking-wider cursor-pointer ${
              activeTab === "forum"
                ? "bg-accent text-canvas font-bold shadow-md"
                : "text-gray-400 hover:text-white hover:bg-[#1C1C1C]"
            }`}
          >
            Traveler Feedback
          </button>
        </div>

        {/* NOT CLOUD SYNCED ADVISORY BANNER */}
        {!user && (
          <div className="bg-amber-950/20 border-l-2 border-amber-500 p-3.5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 animate-fade">
            <div className="flex gap-2">
              <Lock size={16} className="text-amber-500 mt-0.5 shrink-0" />
              <div>
                <span className="text-xs font-mono font-bold text-typography block uppercase tracking-wider">Unsynchronized Sandbox Mode Active</span>
                <p className="text-[11px] text-gray-400 font-sans mt-0.5">Reservations, seat layouts, and luxury suite ratings are cached in local memory. Connect your account to enable Cloud Firestore persistence across sessions.</p>
              </div>
            </div>
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="py-1 px-3 bg-amber-500 hover:bg-amber-400 text-[#121212] text-[10px] font-mono uppercase tracking-wider font-bold transition-all shrink-0 cursor-pointer"
            >
              Secure Sync Now
            </button>
          </div>
        )}

        {/* App Workspace Panel Rendering */}
        <div id="subcomponent-workspace" className="transition-all duration-300">
          {activeTab === "dashboard" && (
            <Dashboard
              user={user}
              hotelsCount={hotels.length}
              flightsCount={flights.length}
              averageRating={reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.stars, 0) / reviews.length : 4.93}
              reviewsCount={reviews.length}
              onNavigateTab={(tab) => setActiveTab(tab)}
              onTriggerLogin={() => {
                setAuthError("");
                setIsAuthModalOpen(true);
              }}
              triggerNotification={triggerNotification}
            />
          )}

          {activeTab === "avionics" && (
            <LiveFlightStatusTrack
              flights={flights}
              onUpdateFlights={setFlights}
              triggerNotification={triggerNotification}
            />
          )}

          {activeTab === "economics" && (
            <PricingEngineHub
              flights={flights}
              hotels={hotels}
              pricingSeason={pricingSeason}
              setPricingSeason={setPricingSeason}
              priceFreezes={priceFreezes}
              onAddPriceFreeze={handleAddPriceFreeze}
              onRemovePriceFreeze={handleRemovePriceFreeze}
              onCreateBookingFromFreeze={handleCreateBookingFromFreeze}
              triggerNotification={triggerNotification}
            />
          )}

          {activeTab === "preferences" && (
            <SelectionStudio
              flights={flights}
              hotels={hotels}
              bookings={bookings}
              onSavePreferences={handleSavePreferences}
              triggerNotification={triggerNotification}
            />
          )}

          {activeTab === "claims" && (
            <ClaimsCenter
              bookings={bookings}
              onCancelBooking={handleCancelBooking}
              triggerNotification={triggerNotification}
            />
          )}

          {activeTab === "recommendations" && (
            <PersonalizedRecommendations
              user={user}
              recommendations={recommendations}
              onVoteRecommendation={handleVoteRecommendation}
              onRefreshRecommendations={handleRefreshRecommendations}
              triggerNotification={triggerNotification}
            />
          )}

          {activeTab === "forum" && (
            <ReviewsForum
              reviews={reviews}
              flights={flights}
              hotels={hotels}
              onAddReview={handleAddReview}
              onAddReply={handleAddReply}
              onFlagReview={handleFlagReview}
              onHelpfulVote={handleHelpfulVote}
              onModerateReview={handleModerateReview}
              triggerNotification={triggerNotification}
            />
          )}
        </div>

        {/* Active Reservations Summary Block (Bottom Ledger) */}
        <div className="border border-border-grid p-6 bg-panel mt-4" id="active-summary-ledger">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-grid pb-4 mb-4">
            <div>
              <span className="font-mono text-[9px] text-accent uppercase tracking-widest block mb-0.5">Session Overview</span>
              <h3 className="font-serif italic font-bold text-xl text-typography">Active Passenger Claims Log</h3>
            </div>
            <span className="font-mono text-[10px] bg-[#1A1A1A] border border-border-grid px-2 py-1 text-gray-400">
              Session Ref ID: TX-7KQI
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {bookings
              .filter((b) => b.status === "active")
              .map((b) => {
                const currentOriginalPrice = b.originalPrice;
                const computedCurrentPrice = Math.round(currentOriginalPrice * mod);
                const hasUpgradeCharge = b.amountPaid !== currentOriginalPrice;

                return (
                  <div
                    key={b.id}
                    id={`summary-row-${b.id}`}
                    className="border border-border-grid p-4 bg-[#141414] hover:bg-[#181818] transition-all flex flex-col justify-between h-40"
                  >
                    <div className="flex flex-col gap-1.5">
                      <div className="flex justify-between items-start">
                        <span className="font-mono text-[9px] px-1.5 py-0.5 bg-accent/10 border border-accent text-accent uppercase tracking-wider font-semibold">
                          {b.type}
                        </span>
                        <span className="font-mono text-[9px] text-gray-500 uppercase tracking-widest">
                          RES-#{b.id}
                        </span>
                      </div>
                      <h4 className="font-serif italic font-bold text-base text-typography truncate" title={b.title}>
                        {b.title}
                      </h4>
                      <p className="text-xs text-gray-400 font-sans truncate" title={b.detail}>
                        {b.detail}
                      </p>
                    </div>

                    <div className="flex justify-between items-end border-t border-border-grid/50 pt-2.5 mt-2">
                      <div>
                        {hasUpgradeCharge ? (
                          <>
                            <span className="text-[8px] text-gray-500 font-mono block">UPGRADED SECURED RATE:</span>
                            <span className="text-sm font-bold font-mono text-emerald-400">${b.amountPaid} USD</span>
                          </>
                        ) : (
                          <>
                            <span className="text-[8px] text-gray-500 font-mono block">CATALOG ACQUIRED RATE:</span>
                            <span className="text-sm font-bold font-mono text-typography">${b.amountPaid} USD</span>
                          </>
                        )}
                      </div>
                      <div className="text-right">
                        <span className="text-[8px] text-gray-500 font-mono block">CURRENT SEASON VALUE:</span>
                        <span className={`text-xs font-semibold font-mono ${computedCurrentPrice > b.amountPaid ? "text-amber-500" : "text-gray-400"}`}>
                          ${computedCurrentPrice} USD (x{mod.toFixed(2)})
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </main>

      {/* Archival Terminal Footer */}
      <footer className="bg-panel border-t border-border-grid py-6" id="main-footer">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs font-mono text-gray-500">
          <div>
            <span>SYSTEM LEDGER CORE: V4.19-RELEASE-STABLE</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="hover:text-white transition-all cursor-pointer">Security Protocol JSON</span>
            <span>•</span>
            <span className="hover:text-white transition-all cursor-pointer">Avionics API Schema</span>
          </div>
          <div>
            <span>DATE LOGGED: 2026-06-19 11:22 UTC</span>
          </div>
        </div>
      </footer>

      {/* DYNAMIC RETRO-NEON ACCOUNT LEDGER AUTH DIALOG OVERLAY */}
      {isAuthModalOpen && (
        <div className="fixed inset-0 bg-black/85 flex items-center justify-center p-4 z-50 animate-fade" id="auth-modal-overlay">
          <div className="bg-[#121212] border border-border-grid max-w-md w-full p-6 relative flex flex-col gap-5 [box-shadow:0_0_20px_rgba(0,0,0,0.8)]">
            {/* Close Toggle */}
            <button
              onClick={() => setIsAuthModalOpen(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-white p-1 hover:bg-[#1F1F1F] cursor-pointer"
            >
              <X size={16} />
            </button>

            {/* Title Block */}
            <div className="border-b border-border-grid pb-3.5">
              <span className="font-mono text-[9px] text-accent uppercase tracking-widest block mb-1">Grid Authentication Unit</span>
              <h3 className="font-serif italic font-bold text-xl text-typography flex items-center gap-2">
                <Lock size={18} className="text-accent" />
                <span>Synchronize System Ledger</span>
              </h3>
              <p className="text-[11px] text-gray-400 font-sans mt-0.5">Ensure real-time multi-terminal cloud sync for reviews, seats preferences, and refund trackers.</p>
            </div>

            {/* IFRAME POPUP PROTOCOL HANDLER BREATHER BAR */}
            <div className="bg-[#181206] border border-[#EAB308]/25 p-3 flex flex-col gap-2">
              <span className="font-mono text-[9px] text-[#EAB308] uppercase tracking-widest block font-bold flex items-center gap-1.5">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#EAB308] animate-pulse"></span>
                IFrame Sandboxed Sandbox Protocol
              </span>
              <p className="text-[10px] text-gray-300 leading-normal font-sans">
                Google Single Sign-On requires a direct top-level browser tab. If you see a "Popup Blocked" error inside the AI Studio playground, open the app directly to sync safely:
              </p>
              <a
                href={typeof window !== "undefined" ? window.location.href : "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-[#EAB308] hover:bg-[#EAB308]/90 text-[#0F0F0F] font-mono text-[9.5px] font-bold uppercase tracking-wider transition-all self-start"
              >
                <ExternalLink size={11} />
                <span>Open Standalone App Tab</span>
              </a>
            </div>

            {/* Google Fast Sync Block */}
            <button
              onClick={handleGoogleAuth}
              disabled={authLoading}
              className="w-full py-2.5 border border-accent bg-accent/5 hover:bg-accent/15 cursor-pointer text-accent font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all"
            >
              <LogIn size={14} />
              <span>Sign In / Registers with Google</span>
            </button>

            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-border-grid/55"></div>
              <span className="flex-shrink mx-4 font-mono text-[9px] text-gray-600 uppercase">Or Email Ledger Access</span>
              <div className="flex-grow border-t border-border-grid/55"></div>
            </div>

            {/* Auth Tab Selector */}
            <div className="grid grid-cols-2 bg-[#1A1A1A] p-1 border border-border-grid">
              <button
                onClick={() => { setAuthTab("login"); setAuthError(""); }}
                className={`py-1.5 font-mono text-xs uppercase tracking-wider transition-all cursor-pointer ${
                  authTab === "login" ? "bg-accent/10 border-b-2 border-accent text-accent font-bold" : "text-gray-500 hover:text-white"
                }`}
              >
                Access Account
              </button>
              <button
                onClick={() => { setAuthTab("signup"); setAuthError(""); }}
                className={`py-1.5 font-mono text-xs uppercase tracking-wider transition-all cursor-pointer ${
                  authTab === "signup" ? "bg-accent/10 border-b-2 border-accent text-accent font-bold" : "text-gray-500 hover:text-white"
                }`}
              >
                Create Account
              </button>
            </div>

            {/* Interactive Forms */}
            <form onSubmit={handleEmailAuthSubmit} className="flex flex-col gap-4">
              {authTab === "signup" && (
                <div className="flex flex-col gap-1.5 animate-fade" id="register-field-username">
                  <label className="font-mono text-[10px] text-gray-500 uppercase">Username / Call Sign</label>
                  <input
                    type="text"
                    required
                    value={authUsername}
                    onChange={(e) => setAuthUsername(e.target.value)}
                    placeholder="voyager_alpha"
                    className="bg-panel font-sans text-xs border border-border-grid text-typography px-3.5 py-2.5 focus:border-accent focus:outline-none w-full"
                  />
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="font-mono text-[10px] text-gray-500 uppercase">Registered Email ID</label>
                <input
                  type="email"
                  required
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  placeholder="agent@aeris-dispatch.io"
                  className="bg-panel font-sans text-xs border border-border-grid text-typography px-3.5 py-2.5 focus:border-accent focus:outline-none w-full"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-mono text-[10px] text-gray-500 uppercase">System Password</label>
                <input
                  type="password"
                  required
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="bg-panel font-sans text-xs border border-border-grid text-typography px-3.5 py-2.5 focus:border-accent focus:outline-none w-full"
                />
              </div>

              {authTab === "signup" && (
                <div className="flex flex-col gap-1.5 animate-fade" id="register-field-confirm-password">
                  <label className="font-mono text-[10px] text-gray-500 uppercase">Confirm System Password</label>
                  <input
                    type="password"
                    required
                    value={authConfirmPassword}
                    onChange={(e) => setAuthConfirmPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="bg-panel font-sans text-xs border border-border-grid text-typography px-3.5 py-2.5 focus:border-accent focus:outline-none w-full"
                  />
                </div>
              )}

              {authError && (
                <div className="p-3 bg-red-950/20 border-l border-red-500 text-red-400 font-mono text-[11px] leading-relaxed">
                  {authError}
                </div>
              )}

              <button
                type="submit"
                disabled={authLoading}
                className="w-full py-2.5 bg-accent hover:bg-accent/90 disabled:bg-gray-800 text-canvas font-mono text-xs font-extrabold uppercase tracking-widest transition-all mt-1 cursor-pointer"
              >
                {authLoading ? "Initializing Core Link..." : authTab === "login" ? "Authorize Terminal Code" : "Register Credentials"}
              </button>
            </form>

            <div className="text-[9px] font-mono text-gray-600 leading-normal border-t border-border-grid/50 pt-3">
              <span>Security assurance: standard AES-256 encrypted endpoints handle login keys directly. Standard Google workspace and Firebase accounts accepted natively.</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
