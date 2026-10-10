/**
 * The terms of use for the public website, as the blocks DocumentPage renders.
 *
 * They cover this marketing site only: browsing it, sending an enquiry and reading
 * the live figures. The Milk Nest application that customers use is provided under a
 * separate agreement, and these terms say so rather than trying to cover it. When the
 * site changes, change the matching paragraph and `updatedOn` together.
 */
export const terms = {
  eyebrow: "Terms & Conditions",
  title: "Terms and conditions for this website.",
  emphasis: "this website.",
  updatedOn: "10 October 2026",
  intro: "The short rules for visiting this site, sending us an enquiry and reading the live figures.",

  sections: [
    {
      id: "draft-notice",
      body: [
        {
          type: "note",
          text: "Draft for review. Prepared for the Milk Nest team to check before publishing; not yet in force.",
        },
      ],
    },

    {
      id: "acceptance",
      heading: "Acceptance and scope",
      body: [
        {
          type: "p",
          text: "By using this website you agree to these terms; if you do not agree, please do not use it. They apply to the public website only. The Milk Nest application itself is provided to customers under a separate agreement, which these terms do not change.",
        },
      ],
    },

    {
      id: "using-the-site",
      heading: "Using the site",
      body: [
        { type: "p", text: "You may browse, read, link to and share this site. You agree not to:" },
        {
          type: "list",
          items: [
            "try to reach any part of the site, its server or its API that is not offered to visitors",
            "probe or test the site for weaknesses, or interfere with its availability for others",
            "send automated, bulk or false enquiries, or enquiries for someone who has not asked you to",
            "copy the site's content for commercial use or present it as your own",
          ],
        },
        { type: "p", text: "We may block access from an address or network that breaks these rules." },
      ],
    },

    {
      id: "enquiries",
      heading: "Enquiries",
      body: [
        {
          type: "p",
          text: "Sending the enquiry form asks us to get in touch about Milk Nest. It is an invitation to talk, not a contract: it obliges neither of us to anything. We accept one enquiry per email address and try to answer every genuine one, without promising a response time. The details you send must be accurate and your own; how we handle them is described in our privacy policy.",
        },
      ],
    },

    {
      id: "live-figures",
      heading: "Live figures",
      body: [
        {
          type: "p",
          text: "The home page shows aggregate totals from the Milk Nest platform, such as milk recorded today and animals on record. They are indicative only: they may be delayed, rounded or temporarily unavailable, and they are not a statement about any farm's production or about Milk Nest as a business. Do not rely on them for any decision.",
        },
      ],
    },

    {
      id: "intellectual-property",
      heading: "Intellectual property",
      body: [
        {
          type: "p",
          text: "The Milk Nest name and logo, and the text, images, design and code of this site, belong to us; reproduction beyond a personal copy for reference needs our written permission. The site also uses open-source work under its own licences, including the Instrument Serif typeface (SIL Open Font License), and nothing here limits the rights those licences give you.",
        },
      ],
    },

    {
      id: "liability",
      heading: "No warranties and limited liability",
      body: [
        {
          type: "p",
          text: "The website is provided as it is and as available. We do not promise that it is accurate, complete, always available or free of errors, and descriptions of the application here are general: what a customer receives is defined by their agreement with us. To the extent the law allows, we are not liable for any loss that comes from using this site or relying on it. Nothing here excludes a liability that cannot be excluded under Indian law.",
        },
      ],
    },

    {
      id: "governing-law",
      heading: "Governing law",
      body: [
        {
          type: "p",
          text: "These terms are governed by the laws of India. Any dispute about them or about the website will be decided by the courts of Andhra Pradesh, India.",
        },
      ],
    },

    {
      id: "changes-and-contact",
      heading: "Changes and contact",
      body: [
        {
          type: "p",
          text: "We may update these terms when the website changes; the date at the top shows the current version, and continuing to use the site after a change means you accept it. Questions can be sent to us here:",
        },
        { type: "contact" },
      ],
    },
  ],
};
