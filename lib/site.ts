/**
 * Church contact details and recurring schedule.
 *
 * Seed and fallback for the `settings/site` Firestore document — public
 * pages read that document via lib/site-settings.ts and get these
 * constants when Firestore is unconfigured or unreachable. Fields the
 * settings schema doesn't cover (name, shortName, heroVerse, ein,
 * taxStatus) are still read from here directly.
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
  /** Federal tax ID — Amazing Grace Ministries MN is a 501(c)(3) nonprofit. */
  ein: '45-4194626',
  taxStatus: 'a 501(c)(3) nonprofit organization',
  socials: {
    facebook: 'https://web.facebook.com/amazinggracemn',
    instagram: 'https://www.instagram.com/amazinggracemn',
    youtube: 'https://www.youtube.com/@amazinggracemn',
  },
} as const
