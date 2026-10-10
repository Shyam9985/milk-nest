/**
 * The privacy policy, as the blocks DocumentPage renders.
 *
 * Every statement here describes the website as built: the enquiry form and what the
 * server stores with it, the two localStorage preferences, the aggregate live figures,
 * and the absence of analytics or third-party scripts. When one of those changes,
 * change the matching paragraph and `updatedOn` together.
 *
 * Block types: p (paragraph), list (bullets), note (highlighted callout) and contact
 * (the live contact details from config/site.js). Text between backticks is set as code.
 */
export const privacyPolicy = {
  eyebrow: "Privacy Policy",
  title: "Our privacy policy, in plain words.",
  emphasis: "in plain words.",
  updatedOn: "10 October 2026",
  intro: "This website collects very little. Here is what, why, and what you can ask us to do about it.",

  sections: [
    {
      id: "draft-notice",
      body: [
        {
          type: "note",
          text: "Draft for review. Prepared for the Milk Nest team to check against the live setup before it is published; not yet in force.",
        },
      ],
    },

    {
      id: "scope",
      heading: "What this covers",
      body: [
        {
          type: "p",
          text: "This policy covers the public website only: these pages, the enquiry form and the live figures on the home page. The Milk Nest application that farms use every day is a separate system, and the farm data kept there is governed by each customer's agreement with us.",
        },
      ],
    },

    {
      id: "what-we-collect",
      heading: "What we collect",
      body: [
        {
          type: "p",
          text: "When you send an enquiry we store your name, phone number, email address, farm name (if given) and message, together with the IP address and browser identifier the request came from. One enquiry is accepted per email address.",
        },
        {
          type: "p",
          text: "Your theme and text-size choices are saved in your own browser and are never sent to us. The live figures on the home page are aggregate totals from our server and contain no personal data. Our server keeps ordinary access logs (address requested, time, IP address, browser identifier).",
        },
        {
          type: "p",
          text: "We run no analytics, no advertising cookies and no third-party scripts.",
        },
      ],
    },

    {
      id: "how-we-use-it",
      heading: "How we use it",
      body: [
        {
          type: "p",
          text: "We use your enquiry details to reply to you, arrange a demo or walkthrough, and keep track of the conversation. IP addresses and browser identifiers help us limit the rate of requests, spot spam and respond to attacks. We do not build profiles, make automated decisions about you, or add you to a marketing list.",
        },
      ],
    },

    {
      id: "cookies-and-local-storage",
      heading: "Cookies and local storage",
      body: [
        {
          type: "p",
          text: "The site sets no cookies. It uses two entries in your browser's local storage, written only when you change a setting: `milk-nest-theme` (light or dark) and `milk-nest-font-scale` (text size). Switch the settings back to their defaults, or clear this site's data, to remove them.",
        },
      ],
    },

    {
      id: "sharing-and-retention",
      heading: "Sharing and how long we keep it",
      body: [
        {
          type: "p",
          text: "We do not sell personal data or share it with advertisers. The companies that host our website, database and email store data on our behalf and may not use it for their own purposes. We disclose information only when a law, a court order or a competent authority requires it.",
        },
        {
          type: "p",
          text: "Enquiries are kept while we are in touch with you and for up to 24 months after our last contact, then deleted. Server logs are kept briefly and rotated out. You can ask us to delete an enquiry sooner at any time.",
        },
      ],
    },

    {
      id: "your-rights",
      heading: "Your rights",
      body: [
        {
          type: "p",
          text: "India's Digital Personal Data Protection Act, 2023 gives you the right to know what we hold about you, to have it corrected or deleted, and to withdraw the consent you gave when you sent the form. Ask us using the contact details below; we will confirm the request comes from the email address on the enquiry and reply within a reasonable time. If you are not satisfied, you can raise it with the Data Protection Board of India.",
        },
      ],
    },

    {
      id: "security",
      heading: "Security",
      body: [
        {
          type: "p",
          text: "The site is served over HTTPS, enquiries sit in a database that only our team can reach, and the server checks and rate-limits every submission. We keep what we hold to a minimum, so there is little to lose.",
        },
      ],
    },

    {
      id: "changes-and-contact",
      heading: "Changes and contact",
      body: [
        {
          type: "p",
          text: "When the website changes in a way that affects your data, we update this page; the date at the top tells you when. Questions about this policy, or a request about your data, can be sent to us here:",
        },
        { type: "contact" },
      ],
    },
  ],
};
