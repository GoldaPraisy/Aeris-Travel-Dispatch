/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Booking } from "../types";
import { CANCELLATION_REASONS } from "../data";
import { AlertTriangle, TrendingUp, RefreshCw, Layers, ShieldCheck, XCircle, ArrowRight, DollarSign, Clock } from "lucide-react";

interface ClaimsCenterProps {
  bookings: Booking[];
  onCancelBooking: (bookingId: string, reason: string, refundAmount: number, timeline: string) => void;
  triggerNotification: (title: string, message: string, type: "info" | "alert" | "success" | "warning") => void;
}

export default function ClaimsCenter({
  bookings,
  onCancelBooking,
  triggerNotification
}: ClaimsCenterProps) {
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [reason, setReason] = useState<string>(CANCELLATION_REASONS[0]);

  // Filters
  const activeBookings = bookings.filter((b) => b.status === "active");
  const canceledBookings = bookings.filter((b) => b.status === "refunded" || b.status === "pending_refund" || b.status === "completed");

  const selectedBooking = bookings.find((b) => b.id === selectedBookingId);

  // Auto-calculate the refund percentage and amount based on booking date
  const calculateRefund = (booking: Booking): { refundAmount: number; percentage: number; rationale: string } => {
    // Determine creation time vs cancel time
    const createdDate = new Date(booking.createdAt).getTime();
    const now = Date.now();
    const diffHours = (now - createdDate) / (1000 * 60 * 60);

    // Dynamic Policy Calculation
    if (diffHours <= 24) {
      // "50% refund if canceled within 24 hours of reservation"
      const amt = Math.round(booking.amountPaid * 0.5);
      return {
        refundAmount: amt,
        percentage: 50,
        rationale: "Canceled within 24 hours of booking. Policy warrants exactly 50% refund."
      };
    } else {
      // Over 24 hours
      const amt = Math.round(booking.amountPaid * 0.9);
      return {
        refundAmount: amt,
        percentage: 90,
        rationale: "Long-term reservation cancellation. Incentive policy warrants 90% refund."
      };
    }
  };

  const handleCancelClick = (bookingId: string) => {
    setSelectedBookingId(bookingId);
  };

  const handleConfirmCancellation = () => {
    if (!selectedBooking) return;

    const { refundAmount, rationale } = calculateRefund(selectedBooking);
    const expectedTimeline = "2-3 business days (Direct ACH Back)";

    onCancelBooking(selectedBooking.id, reason, refundAmount, expectedTimeline);

    triggerNotification(
      "Cancellation Resolved",
      `Booking #${selectedBooking.id} canceled. Applied refund of $${refundAmount} USD (${rationale})`,
      "success"
    );

    setSelectedBookingId(null);
  };

  return (
    <div className="bg-panel border border-border-grid p-6 rounded-none flex flex-col gap-6" id="claims-center-card">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-border-grid pb-5">
        <div>
          <span className="font-mono text-[9px] text-accent uppercase tracking-widest block mb-1">Claims Center & Terminal</span>
          <h2 className="font-serif italic font-bold text-2xl text-typography">Cancellations & Refunds</h2>
          <p className="text-xs text-gray-400 font-sans mt-0.5">Cancel bookings directly with auto-computed partial refunds and live timeline status trackers.</p>
        </div>

        {/* Policy Box */}
        <div className="bg-[#1A1A1A] p-2.5 border border-border-grid text-[10px] font-mono leading-relaxed text-gray-400 max-w-xs">
          <span className="text-accent font-bold uppercase tracking-wider block mb-1">Standard Refund Policies:</span>
          <p>• Within 24 hr of booking: <span className="text-typography font-bold">50% returned</span></p>
          <p>• Over 24 hr of booking: <span className="text-typography font-semibold">90% returned</span></p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Active Ledger Cancellations Desk */}
        <div className="lg:col-span-7 flex flex-col gap-4 border-r border-border-grid pr-0 lg:pr-6">
          <div className="flex justify-between items-center pb-2">
            <span className="font-serif italic font-bold text-base text-typography">Your Active Reserved Ledgers</span>
            <span className="font-mono text-[10px] bg-[#1A1A1A] px-2 py-0.5 border border-border-grid text-gray-400">
              {activeBookings.length} Active Bookings
            </span>
          </div>

          <div className="flex flex-col gap-3 max-h-[300px] overflow-y-auto">
            {activeBookings.length > 0 ? (
              activeBookings.map((booking) => {
                const { refundAmount, percentage, rationale } = calculateRefund(booking);

                return (
                  <div
                    key={booking.id}
                    id={`active-booking-row-${booking.id}`}
                    className="border border-border-grid p-4 bg-[#141414] hover:border-gray-500 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex flex-col gap-1">
                      <span className="font-mono text-[9px] text-accent font-semibold uppercase">{booking.type}</span>
                      <h4 className="font-serif italic font-bold text-base text-typography leading-tight">{booking.title}</h4>
                      <p className="text-xs text-gray-400 font-sans">{booking.detail}</p>
                      <div className="flex items-center gap-2 font-mono text-[10px] text-gray-500 mt-1">
                        <span>Paid: <span className="text-typography">${booking.amountPaid}</span></span>
                        <span>•</span>
                        <span>Booked date: {new Date(booking.bookingTime).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="flex flex-col items-stretch sm:items-end gap-2 shrink-0">
                      <div className="text-left sm:text-right">
                        <span className="font-mono text-[9px] text-gray-500 block uppercase">Estimated Refund</span>
                        <span className="font-mono text-sm font-bold text-emerald-400">${refundAmount} USD ({percentage}%)</span>
                      </div>
                      <button
                        id={`cancel-trigger-${booking.id}`}
                        onClick={() => handleCancelClick(booking.id)}
                        className="py-1 px-3 border border-red-950/50 hover:bg-red-950/20 text-red-500 font-mono text-[11px] uppercase tracking-wider transition-all cursor-pointer"
                      >
                        Cancel Reservation
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="border border-border-grid border-dashed p-8 text-center italic text-xs text-gray-500 bg-[#111111]">
                No active bookings currently held in this terminal session.
              </div>
            )}
          </div>

          {/* Cancellation Interaction Dialog Box */}
          {selectedBookingId && selectedBooking && (
            <div id="cancellation-form-card" className="border border-red-950/50 p-4 bg-[#1A1111]/60 flex flex-col gap-4 mt-2">
              <div className="flex items-center gap-2 text-red-500 border-b border-red-950/50 pb-2">
                <AlertTriangle size={15} />
                <span className="font-mono font-bold text-xs uppercase">Initiating Booking Revocation #{selectedBooking.id}</span>
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="font-mono text-[10px] text-gray-400 uppercase">Reason for Cancellation (Trend Tracking Required)</span>
                <select
                  id="cancellation-reason-dropdown"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="bg-panel font-sans text-xs border border-border-grid text-typography px-3 py-2.5 outline-none focus:border-red-500 cursor-pointer"
                >
                  {CANCELLATION_REASONS.map((r, rIdx) => (
                    <option key={rIdx} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              {/* Refund calculation report */}
              {(() => {
                const { refundAmount, rationale, percentage } = calculateRefund(selectedBooking);
                return (
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3 p-3 bg-panel border border-border-grid text-xs">
                    <div className="md:col-span-8 flex flex-col gap-1">
                      <span className="font-mono text-[9px] text-gray-500 uppercase">Auto Calculation Protocol</span>
                      <p className="font-sans text-gray-400 text-[11px]">{rationale}</p>
                    </div>
                    <div className="md:col-span-4 flex flex-col items-start md:items-end border-t md:border-t-0 md:border-l border-border-grid pt-2 md:pt-0 pl-0 md:pl-3">
                      <span className="font-mono text-[9px] text-gray-500 uppercase">Estimated Recovery</span>
                      <span className="font-mono text-base font-extrabold text-emerald-400 mt-0.5">${refundAmount} USD</span>
                      <span className="text-[10px] text-gray-500">Partial refund applied ({percentage}%)</span>
                    </div>
                  </div>
                );
              })()}

              <div className="flex gap-2 justify-end">
                <button
                  id="confirm-cancel-btn"
                  onClick={handleConfirmCancellation}
                  className="px-4 py-2 bg-red-600 hover:bg-red-500 text-canvas font-mono text-xs font-bold uppercase tracking-wider cursor-pointer"
                >
                  Confirm Full Revocation
                </button>
                <button
                  id="cancel-abort-btn"
                  onClick={() => setSelectedBookingId(null)}
                  className="px-4 py-2 border border-border-grid hover:border-gray-500 font-mono text-xs text-gray-400 hover:text-white transition-all cursor-pointer"
                >
                  Abort
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right: Refund Status Tracker Log */}
        <div className="lg:col-span-5 flex flex-col justify-between">
          <div className="flex flex-col gap-4">
            <div className="border-b border-border-grid pb-2">
              <span className="font-mono text-[10px] text-gray-400 uppercase tracking-wider">Refund Status Tracker</span>
              <h3 className="font-serif italic font-bold text-lg text-typography mt-1">Status Logs & Timelines</h3>
            </div>

            <p className="text-xs text-gray-400 font-sans leading-relaxed">
              Below represents your processed, pending, or completed monetary returns. Auditable timestamps are automatically recorded upon claim submission.
            </p>

            {/* List of canceled claims */}
            <div className="flex flex-col gap-3 max-h-[340px] overflow-y-auto mt-2 pr-1">
              {canceledBookings.length > 0 ? (
                canceledBookings.map((claim) => (
                  <div
                    key={claim.id}
                    id={`claim-row-${claim.id}`}
                    className="border border-border-grid p-3.5 bg-[#141414] flex flex-col gap-2"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-mono text-[9px] text-gray-500 uppercase">CLAIM RES-ID: #{claim.id}</span>
                        <h4 className="font-serif italic font-bold text-[13px] text-typography leading-tight">{claim.title}</h4>
                      </div>
                      <span
                        className={`text-[9px] font-mono uppercase px-1.5 py-0.5 border ${
                          claim.status === "refunded" || claim.status === "completed"
                            ? "bg-emerald-950/20 border-emerald-900/40 text-emerald-400"
                            : "bg-amber-950/20 border-amber-900/40 text-amber-500 animate-pulse"
                        }`}
                      >
                        {claim.status === "refunded" || claim.status === "completed" ? "Completed" : "Pending Approval"}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 bg-[#1A1A1A] p-2 text-[10px] font-mono leading-tight">
                      <div>
                        <span className="text-gray-500 block">RECOVERED SUM:</span>
                        <span className="text-typography font-bold text-xs">${claim.refundAmount} USD</span>
                      </div>
                      <div>
                        <span className="text-gray-500 block">EXPECTED TIMELINE:</span>
                        <span className="text-gray-400 text-xs block truncate" title={claim.expectedRefundTime}>
                          {claim.expectedRefundTime || "2-3 Business Days"}
                        </span>
                      </div>
                    </div>

                    {claim.cancellationReason && (
                      <div className="text-[10px] text-gray-500 italic mt-0.5">
                        <span className="font-semibold font-mono not-italic text-[9px] uppercase">Reason reported: </span>
                        "{claim.cancellationReason}"
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="border border-border-grid border-dashed p-8 text-center italic text-xs text-gray-500 bg-[#111111] flex flex-col items-center gap-2">
                  <XCircle size={20} className="text-gray-600" />
                  <span>No historic cancellations or refund claims recorded.</span>
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-border-grid/50 flex items-start gap-2 text-[10px] text-gray-500 leading-normal">
            <ShieldCheck size={14} className="text-gray-400 shrink-0 mt-0.5" />
            <span>
              All transactions comply with our customer protection ledger guidelines. Claims undergo security audits instantly.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
