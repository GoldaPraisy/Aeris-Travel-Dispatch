/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type FlightStatus = "On Time" | "Delayed" | "Boarding";

export interface Flight {
  id: string;
  flightNumber: string;
  origin: string;
  destination: string;
  originCode: string;
  destinationCode: string;
  departureTime: string; // HH:MM Local
  arrivalTime: string;   // HH:MM Local
  status: FlightStatus;
  delayReason?: string;
  revisedSchedule?: string;
  etaMinutes: number; // minutes remaining to land/depart
  basePrice: number;
  carrier: string;
  gate: string;
  duration: string;
  altitude?: string;
  speed?: string;
  isRealApiData?: boolean;
  lat?: number;
  lng?: number;
  country?: string;
}

export interface Hotel {
  id: string;
  name: string;
  location: string;
  rating: number;
  basePricePerNight: number;
  roomsAvailable: number;
  description: string;
  image: string;
  amenities: string[];
}

export interface Booking {
  id: string;
  type: "flight" | "hotel";
  targetId: string; // flight id or hotel id
  title: string;
  detail: string; // e.g. "Seat 12F" or "Executive Suite Room 310"
  amountPaid: number;
  bookingTime: string; // ISO date string of booking date
  createdAt: string; // ISO date string of creation
  status: "active" | "pending_refund" | "refunded" | "completed";
  cancellationReason?: string;
  refundAmount?: number;
  refundStatus: "none" | "pending" | "processed" | "completed";
  expectedRefundTime?: string; // Timeframe string
  seatSelection?: string;
  roomSelection?: string;
  originalPrice: number;
}

export interface ReviewReply {
  id: string;
  author: string;
  text: string;
  createdAt: string;
}

export interface Review {
  id: string;
  targetId: string; // Flight or Hotel ID
  targetType: "flight" | "hotel";
  author: string;
  stars: number; // 1-5
  text: string;
  photos: string[]; // Mock links or base64 data
  createdAt: string;
  replies: ReviewReply[];
  helpfulCount: number;
  flagged: boolean;
  votedHelpful?: boolean;
}

export interface Recommendation {
  id: string;
  targetType: "flight" | "hotel";
  targetId: string;
  title: string;
  subtitle: string;
  reason: string;
  matchPercentage: number;
  price: number;
  whyTooltip: string;
  helpful: boolean | null; // true = helpful, false = irrelevant, null = not voted
}

export interface PriceFreeze {
  id: string;
  type: "flight" | "hotel";
  targetId: string;
  title: string;
  frozenPrice: number;
  expiresAt: number; // timestamp
  seatOrRoom?: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  type: "info" | "alert" | "success" | "warning";
  read: boolean;
}

export type PricingSeason = "standard" | "peak" | "holiday" | "offpeak";
