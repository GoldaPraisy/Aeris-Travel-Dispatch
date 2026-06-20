/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Flight, Hotel, Booking, Review, Recommendation } from "./types";

export const INITIAL_FLIGHTS: Flight[] = [
  {
    id: "fl-1",
    flightNumber: "AF-2010",
    origin: "Paris-Charles de Gaulle",
    destination: "New York John F. Kennedy",
    originCode: "CDG",
    destinationCode: "JFK",
    departureTime: "13:45",
    arrivalTime: "16:20",
    status: "On Time",
    etaMinutes: 320,
    basePrice: 590,
    carrier: "Air France",
    gate: "Terminal 2E - Gate K39",
    duration: "8h 35m",
    altitude: "38,000 ft",
    speed: "540 kts"
  },
  {
    id: "fl-2",
    flightNumber: "UA-904",
    origin: "San Francisco Int'l",
    destination: "Tokyo Narita Airport",
    originCode: "SFO",
    destinationCode: "NRT",
    departureTime: "11:15",
    arrivalTime: "14:30",
    status: "Delayed",
    delayReason: "Late arrival of incoming aircraft due to adverse crosswinds at NRT",
    revisedSchedule: "New departure set for 12:45, revised ETA 15:45",
    etaMinutes: 675,
    basePrice: 840,
    carrier: "United Airlines",
    gate: "Int'l Terminal - Gate G92",
    duration: "11h 15m",
    altitude: "0 ft (Grounded)",
    speed: "0 kts"
  },
  {
    id: "fl-3",
    flightNumber: "LH-430",
    origin: "Frankfurt Am Main",
    destination: "Chicago O'Hare",
    originCode: "FRA",
    destinationCode: "ORD",
    departureTime: "17:10",
    arrivalTime: "19:40",
    status: "Boarding",
    etaMinutes: 520,
    basePrice: 710,
    carrier: "Lufthansa",
    gate: "Terminal 1 - Gate Z25",
    duration: "9h 30m",
    altitude: "36,000 ft",
    speed: "510 kts"
  },
  {
    id: "fl-4",
    flightNumber: "EK-201",
    origin: "Dubai International",
    destination: "London Heathrow",
    originCode: "DXB",
    destinationCode: "LHR",
    departureTime: "07:45",
    arrivalTime: "12:15",
    status: "On Time",
    etaMinutes: 15,
    basePrice: 650,
    carrier: "Emirates",
    gate: "Terminal 3 - Gate A12",
    duration: "7h 30m",
    altitude: "4,200 ft (Descending)",
    speed: "250 kts"
  }
];

export const INITIAL_HOTELS: Hotel[] = [
  {
    id: "ht-1",
    name: "The Vermilion Atelier & Suites",
    location: "Champs-Élysées, Paris",
    rating: 4.9,
    basePricePerNight: 350,
    roomsAvailable: 8,
    description: "A masterful restoration of an archival stone estate, pairing bespoke contemporary design with dark charcoal custom finishes, vermilion accents, and a historical Parisian heritage.",
    image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80",
    amenities: ["3D Virtual Atelier Preview", "Dual-Zone Salon", "Bespoke Tea Svc", "Private Balcony"]
  },
  {
    id: "ht-2",
    name: "Ryokan Kasumi (Misty Slate Keep)",
    location: "Kyoto, Japan",
    rating: 4.8,
    basePricePerNight: 280,
    roomsAvailable: 4,
    description: "An authentic Kyoto sanctuary bordered by ancient bamboo trails. Styled in deep basalt stone, charcoal tatami mats, and traditional cedar-wood architecture to induce ultimate sensory rest.",
    image: "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=800&q=80",
    amenities: ["Onsen Water Basin", "Zen Basalt Dry Garden", "Local Kaiseki Menu", "Yukata Attire"]
  },
  {
    id: "ht-3",
    name: "The Obsidian Harbor Tower",
    location: "Soma Precinct, San Francisco",
    rating: 4.6,
    basePricePerNight: 220,
    roomsAvailable: 15,
    description: "Framing sky-high views of the Golden Gate, this sleek architectural spire presents slate interiors, monolithic concrete furniture, and high-tech biometric comfort optimization.",
    image: "https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=800&q=80",
    amenities: ["Tactical Skydeck Pool", "Integrated Smart Studio", "24h Espresso Dispenser", "On-site Gym"]
  }
];

export const INITIAL_BOOKINGS: Booking[] = [
  {
    id: "bk-1",
    type: "flight",
    targetId: "fl-1",
    title: "Flight CDG ➔ JFK (AF-2010)",
    detail: "Seat 12F - standard class window position",
    amountPaid: 590,
    bookingTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days in future
    createdAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString(), // 3 hours ago (within 24h)
    status: "active",
    refundStatus: "none",
    seatSelection: "12F",
    originalPrice: 590
  },
  {
    id: "bk-2",
    type: "hotel",
    targetId: "ht-2",
    title: "Stay at Ryokan Kasumi (Kyoto)",
    detail: "Deluxe King Room (No. 204)",
    amountPaid: 410,
    bookingTime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days in future
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago (outside 24h)
    status: "active",
    refundStatus: "none",
    roomSelection: "Deluxe Upgraded",
    originalPrice: 280
  },
  {
    id: "bk-3",
    type: "flight",
    targetId: "fl-4",
    title: "Flight DXB ➔ LHR (EK-201)",
    detail: "Seat 02A (Premium Upgrade)",
    amountPaid: 800,
    bookingTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // Canceled yesterday
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    status: "refunded",
    cancellationReason: "Schedule Conflict",
    refundAmount: 400,
    refundStatus: "completed",
    expectedRefundTime: "Completed on 2026-06-18",
    seatSelection: "02A (Premium)",
    originalPrice: 800
  }
];

export const INITIAL_REVIEWS: Review[] = [
  {
    id: "rv-1",
    targetId: "ht-1",
    targetType: "hotel",
    author: "Mila Sterling",
    stars: 5,
    text: "The Vermilion Atelier is an absolute design marvel. Every angle of the lounge has been styled with deep volcanic textures and gorgeous matte vermilion lines. Service was ultra-custom. They arranged a bespoke Parisian tea ceremony in my private room facing the Arc. Absolute masterpiece of modern hospitality.",
    photos: ["https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=600&q=80"],
    createdAt: "2026-06-15T14:30:00Z",
    helpfulCount: 24,
    flagged: false,
    replies: [
      {
        id: "rp-1",
        author: "Vermilion Concierge",
        text: "Mila, we are honored you felt the architectural heart of our Atelier. Elevating your Parisian stay is our sole design objective. We look forward to your next archival retreat.",
        createdAt: "2026-06-15T16:12:00Z"
      }
    ]
  },
  {
    id: "rv-2",
    targetId: "ht-2",
    targetType: "hotel",
    author: "Kenji Sato",
    stars: 5,
    text: "An ethereal hideaway that completely preserves absolute spatial rest. The basalt hot springs (Onsen) cleared my mind instantly. Sleeping on the cedar-scented charcoal tatami mats felt deeply connected to classic Kyoto craftsmanship.",
    photos: [],
    createdAt: "2026-06-10T09:15:00Z",
    helpfulCount: 18,
    flagged: false,
    replies: []
  },
  {
    id: "rv-3",
    targetId: "fl-1",
    targetType: "flight",
    author: "Elena Vance",
    stars: 4,
    text: "Pristine service and extremely modern in-flight entertainment. Air France's CDG meal program continues to set high standards—actually served hot with proper premium dining materials. The seat map is easy to navigate, and the extra legroom in row 12 was worth every penny.",
    photos: ["https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=600&q=80"],
    createdAt: "2026-06-14T20:45:00Z",
    helpfulCount: 9,
    flagged: false,
    replies: []
  },
  {
    id: "rv-4",
    targetId: "ht-3",
    targetType: "hotel",
    author: "Marcus Chen",
    stars: 3,
    text: "The smart hub inside the Obsidian Tower is a bit too cold and sterile for my taste. Feels like sleeping inside an airport radar dispatch terminal. It is very technically competent and clean, but missing some organic soul.",
    photos: [],
    createdAt: "2026-06-02T11:00:00Z",
    helpfulCount: 3,
    flagged: false,
    replies: [
      {
        id: "rp-2",
        author: "Devon (Studio Manager)",
        text: "Thank you for the candid feedback Marcus. We deliberately style our Obsidian towers in hard brutalist slate to remove sensory distractions, but appreciate that some guests prefer warmer, softer finishes. We will adjust the smart lighting presets to add warm amber defaults.",
        createdAt: "2026-06-02T13:40:00Z"
      }
    ]
  }
];

export const INITIAL_RECOMMENDATIONS: Recommendation[] = [
  {
    id: "rc-1",
    targetType: "hotel",
    targetId: "ht-2",
    title: "Ryokan Kasumi (Kyoto)",
    subtitle: "Kyoto Classic Rest Sanctuary",
    reason: "Because you booked Ryokan Kasumi in Kyoto previously and rated it 5 stars.",
    matchPercentage: 98,
    price: 280,
    whyTooltip: "Based on collaborative filtering matching travellers who prioritize volcanic stone hot baths, minimal structural slate, and tea rituals.",
    helpful: null
  },
  {
    id: "rc-2",
    targetType: "flight",
    targetId: "fl-1",
    title: "Air France CDG Direct",
    subtitle: "Premium Transatlantic Path",
    reason: "Because your search history indicates 3 recent queries for Parisian destinations and active flight tracking.",
    matchPercentage: 94,
    price: 590,
    whyTooltip: "Our dynamic algorithm identified a correlation between your high-end architectural accommodation preferences in Paris and Air France's terminal availability.",
    helpful: null
  },
  {
    id: "rc-3",
    targetType: "hotel",
    targetId: "ht-1",
    title: "The Vermilion Atelier",
    subtitle: "Parisian Design Masterpiece",
    reason: "Because you like historical, luxury architectural places with rich velvet and vermilion colorways.",
    matchPercentage: 91,
    price: 350,
    whyTooltip: "Synthesized with your Paris CDG Flight booking, pairing premium accommodations with your estimated landing time to bypass check-in queues.",
    helpful: null
  }
];

export const CANCELLATION_REASONS = [
  "Schedule Conflict (Work or Personal)",
  "Medical & Family Emergency",
  "Price Drop, Re-booking Lower Tariff",
  "Disruptive Weather or Destination Warning",
  "Travel Restrictions / Visa Delays",
  "Other / Double Booked"
];
