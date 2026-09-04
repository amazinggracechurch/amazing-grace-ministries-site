/**
 * Church contact details and recurring schedule.
 *
 * Single source of truth for content that used to be hardcoded across
 * components. This becomes the `settings/site` Firestore document in
 * Phase 2 — components must import from here, never hardcode.
 */
export const site = {
  name: 'Amazing Grace Ministries',
  shortName: 'Amazing Grace Ministries MN',
  address: {
    street: '715 Edgerton Street',
    city: 'Saint Paul',
    state: 'MN',
    zip: '55130',
    country: 'United States',
    mapsUrl: 'https://maps.app.goo.gl/yT1Xi1r9cJRBvYLz9',
  },
  heroVerse: {
    text: 'Surely the Lord is in this place.',
    reference: 'Genesis 28:16',
  },
  services: [
    {
      name: 'Sunday Service',
      day: 'Sundays',
      time: '09:00 AM',
      note: 'In person & live streamed',
    },
    {
      name: 'Bible Study — "Digging For Hidden Treasures"',
      day: 'Mondays',
      time: '6:00 PM',
      note: 'Audio dial-in',
    },
    {
      name: 'Midweek Service — "Hour of Battle"',
      day: 'Wednesdays',
      time: '6:00 PM',
      note: 'Audio dial-in',
    },
    {
      name: 'Open Heavens — Monthly Prayer Gathering',
      day: 'of every month',
      time: '1st Saturday',
      note: 'Main Sanctuary',
    },
  ],
  dialIn: {
    numbers: ['470-480-9523', '425-436-6364'],
    code: '198407',
  },
  contact: {
    phone: '(651) 274-9224',
    email: 'info@amazinggracemn.org',
  },
  socials: {
    facebook: 'https://web.facebook.com/amazinggracemn',
    instagram: 'https://www.instagram.com/amazinggracemn',
    youtube: 'https://www.youtube.com/@amazinggracemn',
  },
} as const
