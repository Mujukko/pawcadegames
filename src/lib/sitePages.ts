// Single source for the static info pages (About, Contact, Privacy, Terms).
// Rendered by React (InfoPage) and pre-rendered to static HTML by scripts/prerender.ts.

export const CONTACT_EMAIL = 'hello@pawcadegames.com';
export const LAST_UPDATED = '2026-10-29';

export interface InfoSection {
  heading: string;
  paragraphs: string[];
}

export interface InfoPage {
  id: 'about' | 'contact' | 'privacy' | 'terms';
  route: string;
  navLabel: string;
  h1: string;
  metaTitle: string;
  metaDescription: string;
  intro: string;
  sections: InfoSection[];
}

export const INFO_PAGES: InfoPage[] = [
  {
    id: 'about',
    route: '/about/',
    navLabel: 'About',
    h1: 'About Pawcade Games',
    metaTitle: 'About Pawcade — Free Animal & Farm Browser Games',
    metaDescription:
      'Pawcade is an independent studio making free animal and farm themed browser games. Learn who builds the games, how they are made, and what we promise players.',
    intro:
      'Pawcade is a small independent studio that builds free casual games you can play straight from a web browser. Every game stars animals or farm life, and every game loads without an app store, an account, or a download.',
    sections: [
      {
        heading: 'What we make',
        paragraphs: [
          'Our catalog covers sliding puzzles like Dog Parking, block puzzles, match-3, solitaire, cozy tycoon games, and quick arcade games. Each game is built for short play sessions on phones, tablets, Chromebooks, and desktop computers.',
          'Games are written in TypeScript and run on HTML5 Canvas. Sound effects are synthesized in the browser with the Web Audio API, so pages stay light and load fast on school and home connections.',
        ],
      },
      {
        heading: 'How we build games',
        paragraphs: [
          'Puzzle levels are checked by automated solvers before release, so every level in a puzzle game can be finished. Game logic is covered by automated tests that run before each update goes live.',
          'All artwork, characters, and mechanics on Pawcade are our own. When a game borrows a familiar genre, such as falling blocks or match-3, we say so on its page and build our own version of the idea.',
        ],
      },
      {
        heading: 'Our promises to players',
        paragraphs: [
          'Games are free to play. There are no accounts, no in-game purchases, and no chat with strangers.',
          'Progress and high scores are saved only in your own browser. You can clear them at any time by clearing site data for pawcadegames.com.',
        ],
      },
      {
        heading: 'Get in touch',
        paragraphs: [
          `Found a bug, have a game idea, or want to report a problem? Email us at ${CONTACT_EMAIL}. We read every message.`,
        ],
      },
    ],
  },
  {
    id: 'contact',
    route: '/contact/',
    navLabel: 'Contact',
    h1: 'Contact Pawcade',
    metaTitle: 'Contact Pawcade Games — Bug Reports & Feedback',
    metaDescription:
      'Contact the Pawcade team to report a bug, suggest a game, ask a privacy question, or send a copyright notice.',
    intro: `The fastest way to reach the Pawcade team is email: ${CONTACT_EMAIL}. We usually reply within a few business days.`,
    sections: [
      {
        heading: 'Bug reports',
        paragraphs: [
          'Please include the game name, the device and browser you used (for example "iPhone 15, Safari" or "Chromebook, Chrome"), and what happened right before the problem. A screenshot helps a lot.',
        ],
      },
      {
        heading: 'Game ideas and feedback',
        paragraphs: [
          'Tell us which games you enjoy and what you would like to see next. Player feedback decides which games get new levels first.',
        ],
      },
      {
        heading: 'Privacy and copyright',
        paragraphs: [
          `For privacy requests, or if you believe content on Pawcade infringes your rights, email ${CONTACT_EMAIL} with "Privacy" or "Copyright" in the subject line. Include the page address and a short description so we can act quickly.`,
        ],
      },
    ],
  },
  {
    id: 'privacy',
    route: '/privacy/',
    navLabel: 'Privacy Policy',
    h1: 'Privacy Policy',
    metaTitle: 'Privacy Policy | Pawcade Games',
    metaDescription:
      'How Pawcade Games handles data: no accounts, game progress stored in your browser, and Google Analytics for anonymous usage statistics.',
    intro: `This policy explains what information pawcadegames.com collects and how it is used. Last updated: ${LAST_UPDATED}.`,
    sections: [
      {
        heading: 'Information we do not collect',
        paragraphs: [
          'Pawcade has no user accounts. We do not ask for your name, email address, phone number, or payment details to play any game.',
        ],
      },
      {
        heading: 'Game progress stored on your device',
        paragraphs: [
          'Games save levels, high scores, sound settings, and tutorial choices in your browser using local storage. This data stays on your device and is not sent to us. Clearing site data in your browser removes it.',
        ],
      },
      {
        heading: 'Analytics',
        paragraphs: [
          'We use Google Analytics 4 to understand how many people visit, which games they play, and where games fail to load. Google Analytics sets cookies and collects information such as pages visited, approximate location, device type, and browser. We use this only in aggregate to improve the games.',
          'You can learn how Google uses this data at policies.google.com/technologies/partner-sites, and you can opt out with the Google Analytics Opt-out Browser Add-on.',
        ],
      },
      {
        heading: 'Children',
        paragraphs: [
          'Our games are family friendly. We do not knowingly collect personal information from children, and no game asks players to enter personal information.',
        ],
      },
      {
        heading: 'Changes and contact',
        paragraphs: [
          `If this policy changes, we will update the date at the top of this page. Questions about privacy can be sent to ${CONTACT_EMAIL}.`,
        ],
      },
    ],
  },
  {
    id: 'terms',
    route: '/terms/',
    navLabel: 'Terms of Service',
    h1: 'Terms of Service',
    metaTitle: 'Terms of Service | Pawcade Games',
    metaDescription: 'The terms for using pawcadegames.com and playing Pawcade browser games.',
    intro: `By using pawcadegames.com you agree to these terms. Last updated: ${LAST_UPDATED}.`,
    sections: [
      {
        heading: 'Using the games',
        paragraphs: [
          'Pawcade games are free for personal, non-commercial play. You may not copy, resell, or re-host the games or their artwork without written permission.',
        ],
      },
      {
        heading: 'No warranty',
        paragraphs: [
          'Games are provided "as is". We work to keep them running smoothly, but we cannot promise that every game will work on every device or that saved progress will never be lost.',
        ],
      },
      {
        heading: 'Trademarks',
        paragraphs: [
          'Pawcade and our game names are our own. Other game names mentioned on this site belong to their owners and are used only to describe a genre or style of play; Pawcade is not affiliated with or endorsed by them.',
        ],
      },
      {
        heading: 'Contact',
        paragraphs: [`Questions about these terms can be sent to ${CONTACT_EMAIL}.`],
      },
    ],
  },
];
