/**
 * The website privacy policy, as the blocks DocumentPage renders. It describes the
 * website as built; when the site changes, change the matching paragraph and
 * `updatedOn` together. Block types: p, list, note, contact. Backticks set code,
 * [label](/path) makes a link.
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
        { type: "note", text: "Draft for review by the Milk Nest team before publishing; not yet in force." },
      ],
    },

    {
      id: "scope",
      heading: "What this covers",
      body: [
        {
          type: "p",
          text: "This policy covers the public website. The Milk Nest application that farms use every day is summarised below and set out in full in the [Application Privacy Notice](/application-privacy).",
        },
      ],
    },

    {
      id: "what-we-collect",
      heading: "What we collect",
      body: [
        {
          type: "p",
          text: "When you send an enquiry we store your name, phone number, email address, farm name (if given) and message, with the IP address and browser identifier the request came from. One enquiry is accepted per email address.",
        },
        {
          type: "p",
          text: "Your theme and text-size choices are saved in your own browser and never sent to us. The live figures on the home page are aggregate totals with no personal data. Our server keeps ordinary access logs. We run no analytics, advertising cookies or third-party scripts.",
        },
      ],
    },

    {
      id: "data-in-the-application",
      heading: "Data in the Milk Nest application",
      body: [
        {
          type: "p",
          text: "If your farm becomes a customer, the records your team enters remain your farm's. We store them on servers we control, use them only to run the application for you, never sell them or share them with other farms, and return or delete them when your agreement ends. Accounts and system logs are described in the [Application Privacy Notice](/application-privacy).",
        },
      ],
    },

    {
      id: "how-we-use-it",
      heading: "How we use it",
      body: [
        {
          type: "p",
          text: "Enquiry details are used to reply to you and keep track of the conversation. IP addresses and browser identifiers help us limit requests and stop spam. We do not build profiles, make automated decisions about you, or add you to a marketing list.",
        },
      ],
    },

    {
      id: "cookies-and-local-storage",
      heading: "Cookies and local storage",
      body: [
        {
          type: "p",
          text: "The site sets no cookies. It keeps your theme and text-size settings in your browser's local storage, written only when you change them; switching back to the defaults, or clearing this site's data, removes them.",
        },
      ],
    },

    {
      id: "sharing-and-retention",
      heading: "Sharing and how long we keep it",
      body: [
        {
          type: "p",
          text: "We do not sell personal data. Our hosting, database and email providers store data on our behalf and may not use it themselves; we disclose information only when the law requires it. Enquiries are kept for up to 24 months after our last contact, then deleted. Server logs are kept briefly. You can ask us to delete an enquiry at any time.",
        },
      ],
    },

    {
      id: "your-rights",
      heading: "Your rights",
      body: [
        {
          type: "p",
          text: "Under India's Digital Personal Data Protection Act, 2023 you can ask what we hold about you, have it corrected or deleted, and withdraw the consent you gave when you sent the form. We will verify the request and reply within a reasonable time; if you are not satisfied, you can raise it with the Data Protection Board of India.",
        },
      ],
    },

    {
      id: "security",
      heading: "Security",
      body: [
        {
          type: "p",
          text: "The site is served over HTTPS, enquiries sit in a database only our team can reach, and the server checks and rate-limits every submission. We keep what we hold to a minimum.",
        },
      ],
    },

    {
      id: "changes-and-contact",
      heading: "Changes and contact",
      body: [
        {
          type: "p",
          text: "When the website changes in a way that affects your data, we update this page; the date at the top shows when. Questions and requests can be sent to us here:",
        },
        { type: "contact" },
      ],
    },
  ],
};
