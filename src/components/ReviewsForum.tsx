/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Review, Flight, Hotel, ReviewReply } from "../types";
import { Star, MessageSquare, ShieldAlert, Flag, ThumbsUp, Upload, Filter, Calendar, FolderOpen, ArrowRight, EyeOff, User } from "lucide-react";

interface ReviewsForumProps {
  reviews: Review[];
  flights: Flight[];
  hotels: Hotel[];
  onAddReview: (review: Omit<Review, "id" | "createdAt" | "helpfulCount" | "flagged" | "replies">) => void;
  onAddReply: (reviewId: string, replyText: string) => void;
  onFlagReview: (reviewId: string) => void;
  onHelpfulVote: (reviewId: string) => void;
  onModerateReview: (reviewId: string, action: "approve" | "delete") => void;
  triggerNotification: (title: string, message: string, type: "info" | "alert" | "success" | "warning") => void;
}

export default function ReviewsForum({
  reviews,
  flights,
  hotels,
  onAddReview,
  onAddReply,
  onFlagReview,
  onHelpfulVote,
  onModerateReview,
  triggerNotification
}: ReviewsForumProps) {
  // Sorting & Filtering State
  const [filterType, setFilterType] = useState<"all" | "flights" | "hotels">("all");
  const [sortBy, setSortBy] = useState<"helpful" | "newest" | "highest">("helpful");

  // Form State
  const [reviewTargetId, setReviewTargetId] = useState<string>("ht-1");
  const [authorName, setAuthorName] = useState<string>("Priscilla G.");
  const [ratingStars, setRatingStars] = useState<number>(5);
  const [reviewText, setReviewText] = useState<string>("");
  const [photoInput, setPhotoInput] = useState<string>(""); // Store simulated upload link or b64
  const [filePreview, setFilePreview] = useState<string | null>(null);

  // Active Reply Boxes state map
  const [replyTextMap, setReplyTextMap] = useState<{ [reviewId: string]: string }>({});
  const [activeReplyFormId, setActiveReplyFormId] = useState<string | null>(null);

  const targets = [
    ...flights.map(f => ({ id: f.id, name: `Flight: ${f.flightNumber} (${f.originCode}➔${f.destinationCode})`, type: "flight" as const })),
    ...hotels.map(h => ({ id: h.id, name: `Hotel: ${h.name}`, type: "hotel" as const }))
  ];

  // Simulated photo selection
  const selectMockPhoto = (type: "paris" | "kyoto" | "flight") => {
    let url = "";
    if (type === "paris") url = "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=400&q=80";
    if (type === "kyoto") url = "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=400&q=80";
    if (type === "flight") url = "https://images.unsplash.com/photo-1540962351504-03099e0a754b?auto=format&fit=crop&w=400&q=80";

    setPhotoInput(url);
    setFilePreview(url);
    triggerNotification("Image Attached", "Travel photograph selected for review submission.", "info");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreview(reader.result as string);
        setPhotoInput(reader.result as string);
        triggerNotification("Photograph Selected", "File loaded into local stage.", "success");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleReviewSubmission = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewText.trim()) {
      triggerNotification("Submission Blocked", "Detailed text feedback is required.", "warning");
      return;
    }

    const selectedTarget = targets.find(t => t.id === reviewTargetId)!;

    onAddReview({
      targetId: reviewTargetId,
      targetType: selectedTarget.type,
      author: authorName || "Anonymous Traveler",
      stars: ratingStars,
      text: reviewText,
      photos: photoInput ? [photoInput] : []
    });

    triggerNotification(
      "Feedback Submitted",
      `Review registered for ${selectedTarget.name}. Star rating logged: ${ratingStars}.`,
      "success"
    );

    // Clear Form
    setReviewText("");
    setPhotoInput("");
    setFilePreview(null);
  };

  const handleReplySubmit = (reviewId: string) => {
    const text = replyTextMap[reviewId] || "";
    if (!text.trim()) return;

    onAddReply(reviewId, text);
    setReplyTextMap({ ...replyTextMap, [reviewId]: "" });
    setActiveReplyFormId(null);
    triggerNotification("Reply Broadcasted", "Comment successfully published on traveler thread.", "success");
  };

  // Filter & Sort reviews
  const filteredReviews = reviews
    .filter((rev) => {
      if (filterType === "all") return true;
      return rev.targetType === filterType;
    })
    .sort((a, b) => {
      if (sortBy === "newest") {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sortBy === "highest") {
        return b.stars - a.stars;
      }
      // Most Helpful
      return b.helpfulCount - a.helpfulCount;
    });

  return (
    <div className="bg-panel border border-border-grid p-6 rounded-none flex flex-col gap-6" id="reviews-forum">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-border-grid pb-5">
        <div>
          <span className="font-mono text-[9px] text-accent uppercase tracking-widest block mb-1">Traveler Forum</span>
          <h2 className="font-serif italic font-bold text-2xl text-typography">Review & Rating system</h2>
          <p className="text-xs text-gray-400 font-sans mt-0.5">Participate in traveler exchanges, rate amenities, upload attachments, and flag content.</p>
        </div>

        {/* Quick Summary Counts */}
        <div className="flex gap-4 font-mono text-[10px] bg-[#141414] border border-border-grid p-3 text-gray-400">
          <div>
            <span className="text-gray-500 block uppercase">Total Reviews</span>
            <span className="text-typography font-bold text-sm block mt-0.5">{reviews.length}</span>
          </div>
          <div className="border-l border-border-grid pl-4">
            <span className="text-gray-500 block uppercase">Flagged Reports</span>
            <span className="text-accent font-bold text-sm block mt-0.5">{reviews.filter(r => r.flagged).length}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Left Form Panel: Submit a Review */}
        <div className="xl:col-span-5 border-r border-[#2A2A2A] pr-0 xl:pr-6 flex flex-col gap-4">
          <div className="border-b border-border-grid pb-2">
            <span className="font-mono text-[9px] text-gray-500 uppercase">Write Editorial Log</span>
            <h3 className="font-serif italic font-semibold text-lg text-typography mt-1">Leave Feedback</h3>
          </div>

          <form onSubmit={handleReviewSubmission} className="flex flex-col gap-4 text-xs">
            {/* Author */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="review-author-field" className="font-mono text-[10px] text-gray-400 uppercase">Your Name</label>
              <input
                id="review-author-field"
                type="text"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                className="bg-[#141414] border border-border-grid text-typography font-sans p-2 ml-0 outline-none focus:border-accent"
                placeholder="Priscilla G."
              />
            </div>

            {/* Target Select */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="review-target-field" className="font-mono text-[10px] text-gray-400 uppercase">Select Amenity Target</label>
              <select
                id="review-target-field"
                value={reviewTargetId}
                onChange={(e) => setReviewTargetId(e.target.value)}
                className="bg-[#141414] border border-border-grid text-typography font-mono p-2 outline-none focus:border-accent cursor-pointer"
              >
                {targets.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Stars */}
            <div className="flex flex-col gap-1.5">
              <span className="font-mono text-[10px] text-gray-400 uppercase">Numeric Rating (1-5 Star Scale)</span>
              <div className="flex items-center gap-1.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    id={`star-select-${s}`}
                    type="button"
                    onClick={() => setRatingStars(s)}
                    className="p-1 text-accent hover:scale-110 transition-all cursor-pointer"
                    title={`Rate ${s} star`}
                  >
                    <Star size={20} fill={s <= ratingStars ? "var(--color-accent)" : "none"} />
                  </button>
                ))}
                <span className="font-mono text-[10px] text-gray-400 ml-2">Rating value: {ratingStars} out of 5 stars</span>
              </div>
            </div>

            {/* Text description */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="review-text-field" className="font-mono text-[10px] text-gray-400 uppercase">Detailed Feedback</label>
              <textarea
                id="review-text-field"
                rows={4}
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                className="bg-[#141414] border border-border-grid text-typography font-sans p-3 outline-none focus:border-accent"
                placeholder="Share your absolute experience. Speak on style, spatial rest, and service quality..."
              />
            </div>

            {/* PHOTO UPLOAD SIMULATOR */}
            <div className="flex flex-col gap-1.5 p-3 border border-border-grid bg-[#121212]">
              <span className="font-mono text-[9px] text-gray-400 uppercase block mb-1">Verify Visual Records (Photos)</span>
              <p className="text-[10px] text-gray-500 font-sans leading-relaxed mb-2">
                Drag & Drop or browse real records. Alternatively, click presets to simulate high-res camera integrations.
              </p>

              {/* Browse input */}
              <div className="flex items-center gap-2">
                <label className="flex-1 border border-dashed border-border-grid hover:border-gray-500 p-2 text-center cursor-pointer font-mono font-bold text-[10px] text-gray-400 hover:text-white transition-all flex items-center justify-center gap-1.5">
                  <Upload size={12} />
                  <span>Choose file / Drag File</span>
                  <input
                    id="real-photo-uploader"
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Presets */}
              <div className="grid grid-cols-3 gap-1.5 mt-2">
                <button
                  id="preset-image-paris"
                  type="button"
                  onClick={() => selectMockPhoto("paris")}
                  className="py-1 px-1 border border-border-grid hover:border-accent font-mono text-[8px] uppercase tracking-wide text-gray-400 hover:text-white transition-all cursor-pointer"
                >
                  Paris Atelier
                </button>
                <button
                  id="preset-image-kyoto"
                  type="button"
                  onClick={() => selectMockPhoto("kyoto")}
                  className="py-1 px-1 border border-border-grid hover:border-accent font-mono text-[8px] uppercase tracking-wide text-gray-400 hover:text-white transition-all cursor-pointer"
                >
                  Kyoto Basin
                </button>
                <button
                  id="preset-image-flight"
                  type="button"
                  onClick={() => selectMockPhoto("flight")}
                  className="py-1 px-1 border border-border-grid hover:border-accent font-mono text-[8px] uppercase tracking-wide text-gray-400 hover:text-white transition-all cursor-pointer"
                >
                  Cabin View
                </button>
              </div>

              {/* Preview Box */}
              {filePreview && (
                <div className="mt-3 relative border border-border-grid h-24 overflow-hidden">
                  <img src={filePreview} alt="Review attachment" className="w-full h-full object-cover grayscale opacity-85" />
                  <button
                    id="remove-review-photo-btn"
                    type="button"
                    onClick={() => {
                      setFilePreview(null);
                      setPhotoInput("");
                    }}
                    className="absolute top-1 right-1 bg-black text-white rounded-none p-1 border border-border-grid hover:border-red-500 font-mono text-[8px] line-height-none uppercase"
                  >
                    Clear
                  </button>
                </div>
              )}
            </div>

            <button
              id="submit-review-btn"
              type="submit"
              className="w-full py-2.5 bg-accent hover:bg-accent/90 text-canvas font-mono font-bold uppercase tracking-wider text-xs transition-all cursor-pointer"
            >
              Log Editorial & Ratings
            </button>
          </form>
        </div>

        {/* Right Panel: List Reviews with Filters & Replies */}
        <div className="xl:col-span-7 flex flex-col gap-4">
          {/* Controls: Filtering and Sorting */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-[#141414] border border-border-grid p-3">
            {/* Type filters */}
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-[9px] text-gray-500 uppercase mr-1">Filter:</span>
              {(["all", "flights", "hotels"] as const).map((t) => (
                <button
                  key={t}
                  id={`filter-reviews-btn-${t}`}
                  onClick={() => setFilterType(t)}
                  className={`px-2 py-1 text-[9px] font-mono uppercase border transition-all ${
                    filterType === t
                      ? "bg-accent/10 border-accent text-accent font-semibold"
                      : "border-border-grid text-gray-400 hover:text-white"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* Sort Dropdowns */}
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-[9px] text-gray-500 uppercase mr-1">Sort:</span>
              {(["helpful", "newest", "highest"] as const).map((s) => (
                <button
                  key={s}
                  id={`sort-reviews-btn-${s}`}
                  onClick={() => setSortBy(s)}
                  className={`px-2 py-1 text-[9px] font-mono uppercase border transition-all ${
                    sortBy === s
                      ? "bg-[#1A1A1A] border-accent text-typography font-semibold"
                      : "border-border-grid text-gray-400 hover:text-white"
                  }`}
                >
                  {s === "helpful" ? "Helpful" : s === "newest" ? "Newest" : "Highest"}
                </button>
              ))}
            </div>
          </div>

          {/* List area */}
          <div className="flex flex-col gap-4 max-h-[640px] overflow-y-auto pr-1">
            {filteredReviews.length > 0 ? (
              filteredReviews.map((rev) => {
                const targetName = targets.find(t => t.id === rev.targetId)?.name || rev.targetId;

                return (
                  <div
                    key={rev.id}
                    id={`review-row-${rev.id}`}
                    className={`border p-4 bg-[#121212] flex flex-col gap-3 transition-all ${
                      rev.flagged ? "border-amber-900/60 bg-[#1F1915]" : "border-border-grid hover:border-gray-600"
                    }`}
                  >
                    {/* Header */}
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-serif italic font-bold text-[15px] text-typography">{rev.author}</span>
                          <span className="font-mono text-[9px] text-gray-500 uppercase">verified explorer</span>
                        </div>
                        <span className="font-mono text-[9px] text-accent block uppercase mt-0.5">{targetName}</span>
                      </div>

                      {/* Stars */}
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: 5 }).map((_, stIdx) => (
                          <Star
                            key={stIdx}
                            size={12}
                            fill={stIdx < rev.stars ? "var(--color-accent)" : "none"}
                            className="text-accent"
                          />
                        ))}
                      </div>
                    </div>

                    {/* Content text */}
                    <p className="font-sans text-xs text-gray-300 leading-relaxed">
                      {rev.text}
                    </p>

                    {/* Photos block */}
                    {rev.photos && rev.photos.length > 0 && (
                      <div className="flex gap-2">
                        {rev.photos.map((ph, phIdx) => (
                          <div key={phIdx} className="w-24 h-16 border border-border-grid overflow-hidden bg-gray-900">
                            <img src={ph} alt="Attachment" className="w-full h-full object-cover grayscale opacity-80" />
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Footer buttons (helpful, flag, trigger reply form) */}
                    <div className="flex items-center justify-between border-t border-border-grid/50 pt-2.5 text-[10px] font-mono">
                      <div className="flex items-center gap-3">
                        <button
                          id={`helpful-btn-${rev.id}`}
                          onClick={() => {
                            if (rev.votedHelpful) return;
                            onHelpfulVote(rev.id);
                            triggerNotification("Voted Helpful", "Tallied explorer feedback helper value.", "success");
                          }}
                          className={`flex items-center gap-1.5 transition-all cursor-pointer ${
                            rev.votedHelpful ? "text-accent font-semibold" : "text-gray-400 hover:text-white"
                          }`}
                        >
                          <ThumbsUp size={11} />
                          <span>Helpful ({rev.helpfulCount})</span>
                        </button>

                        <button
                          id={`reply-toggle-btn-${rev.id}`}
                          onClick={() => setActiveReplyFormId(activeReplyFormId === rev.id ? null : rev.id)}
                          className="flex items-center gap-1 text-gray-400 hover:text-white cursor-pointer"
                        >
                          <MessageSquare size={11} />
                          <span>Reply ({rev.replies.length})</span>
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Flagging Trigger */}
                        <button
                          id={`flag-btn-${rev.id}`}
                          disabled={rev.flagged}
                          onClick={() => {
                            onFlagReview(rev.id);
                            triggerNotification("Content Flagged", "Review queued for moderator review. Visual notice applied.", "warning");
                          }}
                          className={`flex items-center gap-1 transition-all ${
                            rev.flagged ? "text-amber-500 font-semibold cursor-not-allowed" : "text-gray-500 hover:text-red-500 cursor-pointer"
                          }`}
                          title="Report review as inappropriate"
                        >
                          <Flag size={10} />
                          <span>{rev.flagged ? "Flagged For Audit" : "Flag"}</span>
                        </button>
                      </div>
                    </div>

                    {/* MODERATOR CONTROL OVERLAY (Simulation proof of concept) */}
                    {rev.flagged && (
                      <div className="bg-[#2D1B13] border border-amber-900 p-2.5 text-[10px] flex flex-col md:flex-row md:items-center justify-between gap-2">
                        <div className="flex items-start gap-1.5 text-amber-400">
                          <ShieldAlert size={12} className="shrink-0 mt-0.5" />
                          <span>
                            <strong className="font-mono block uppercase">FLAGGED FOR INAPPROPRIATE CONTENT AUDITING:</strong>
                            Security monitors queued this thread for rating inflation or inappropriate copy terms.
                          </span>
                        </div>
                        <div className="flex gap-1.5 shrink-0">
                          <button
                            id={`mod-approve-btn-${rev.id}`}
                            onClick={() => {
                              onModerateReview(rev.id, "approve");
                              triggerNotification("Audit Resolution Approved", "Review reinstated with cleared flag metrics.", "success");
                            }}
                            className="bg-emerald-800 hover:bg-emerald-700 text-white font-mono px-2 py-1 uppercase text-[9px] font-bold"
                          >
                            Approve
                          </button>
                          <button
                            id={`mod-delete-btn-${rev.id}`}
                            onClick={() => {
                              onModerateReview(rev.id, "delete");
                              triggerNotification("Audit Resolution Deleted", "Inappropriate content purged from forum registry.", "alert");
                            }}
                            className="bg-red-800 hover:bg-red-700 text-white font-mono px-2 py-1 uppercase text-[9px] font-bold"
                          >
                            Decline & Delete
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Reply List Section */}
                    {rev.replies.length > 0 && (
                      <div className="mt-2 pl-4 border-l border-border-grid flex flex-col gap-2 bg-[#171717]/40 p-2 text-xs">
                        {rev.replies.map((reply) => (
                          <div key={reply.id} className="flex flex-col gap-1">
                            <div className="flex items-center justify-between">
                              <span className="font-serif italic font-semibold text-gray-300">{reply.author}</span>
                              <span className="text-[8px] font-mono text-gray-500">{new Date(reply.createdAt).toLocaleDateString()}</span>
                            </div>
                            <p className="text-gray-400 italic text-[11px] font-sans">
                              "{reply.text}"
                            </p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Active Reply Form Box */}
                    {activeReplyFormId === rev.id && (
                      <div className="flex gap-2 mt-2 pt-2 border-t border-border-grid/30">
                        <input
                          id={`reply-input-field-${rev.id}`}
                          type="text"
                          value={replyTextMap[rev.id] || ""}
                          onChange={(e) => setReplyTextMap({ ...replyTextMap, [rev.id]: e.target.value })}
                          className="flex-1 bg-panel border border-border-grid text-typography font-sans text-xs px-2.5 py-1.5 outline-none focus:border-accent"
                          placeholder="Reply as traveler..."
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleReplySubmit(rev.id);
                          }}
                        />
                        <button
                          id={`reply-submit-btn-${rev.id}`}
                          onClick={() => handleReplySubmit(rev.id)}
                          className="bg-accent hover:bg-accent/90 text-canvas font-mono font-bold uppercase tracking-wider text-[10px] px-3 py-1.5 cursor-pointer"
                        >
                          Submit
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="border border-border-grid border-dashed p-10 text-center italic text-sm text-gray-500 bg-[#111111] flex flex-col items-center gap-2">
                <FolderOpen size={24} className="text-gray-600" />
                <span>No guest reviews found inside this category. Be the first to leave one above.</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
