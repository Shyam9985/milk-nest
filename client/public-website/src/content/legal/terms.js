/**
 * The terms of use for the public website, as the blocks DocumentPage renders. They
 * cover the marketing site and summarise the commitments in every customer agreement
 * for the application. When the site changes, change the matching paragraph and
 * `updatedOn` together.
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
        { type: "note", text: "Draft for review by the Milk Nest team before publishing; not yet in force." },
      ],
    },

    {
      id: "acceptance",
      heading: "Acceptance and scope",
      body: [
        {
          type: "p",
          text: "By using this website you agree to these terms; if you do not agree, please do not use it. The Milk Nest application itself is provided under a separate customer agreement, summarised below.",
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
            "reach for any part of the site, server or API that is not offered to visitors",
            "probe the site for weaknesses or interfere with its availability",
            "send automated, bulk or false enquiries",
            "copy the site's content for commercial use",
          ],
        },
      ],
    },

    {
      id: "enquiries",
      heading: "Enquiries",
      body: [
        {
          type: "p",
          text: "Sending the enquiry form asks us to get in touch; it is an invitation to talk, not a contract. We accept one enquiry per email address and try to answer every genuine one, without promising a response time. The details you send must be accurate and your own; how we handle them is in our [privacy policy](/privacy).",
        },
      ],
    },

    {
      id: "live-figures",
      heading: "Live figures",
      body: [
        {
          type: "p",
          text: "The home page shows aggregate totals from the Milk Nest platform. They are indicative only, may be delayed or rounded, and are not a statement about any farm's production or about Milk Nest as a business. Do not rely on them for any decision.",
        },
      ],
    },

    {
      id: "the-application",
      heading: "The Milk Nest application",
      body: [
        { type: "p", text: "Access to the application is granted under a customer agreement, which always includes these commitments from us:" },
        {
          type: "list",
          items: [
            "the records your team enters belong to your business, not to us",
            "we process them only to provide the service, as described in the [Application Privacy Notice](/application-privacy)",
            "we keep them confidential and never sell them or share them with other farms",
            "when the agreement ends, we return or delete them as agreed",
          ],
        },
        {
          type: "p",
          text: "In return, the customer is responsible for the accounts it creates for its staff and for having the right to enter the details of the people who appear in its records.",
        },
      ],
    },

    {
      id: "intellectual-property",
      heading: "Intellectual property",
      body: [
        {
          type: "p",
          text: "The Milk Nest name and logo, and the text, images, design and code of this site, belong to us; reproduction beyond a personal copy needs our written permission. Open-source work used by the site, including the Instrument Serif typeface, stays under its own licence.",
        },
      ],
    },

    {
      id: "liability",
      heading: "No warranties and limited liability",
      body: [
        {
          type: "p",
          text: "The website is provided as it is and as available; we do not promise it is accurate, complete or always available. To the extent the law allows, we are not liable for any loss that comes from using this site or relying on it. Nothing here excludes a liability that cannot be excluded under Indian law.",
        },
      ],
    },

    {
      id: "governing-law",
      heading: "Governing law",
      body: [
        {
          type: "p",
          text: "These terms are governed by the laws of India, and any dispute will be decided by the courts of Andhra Pradesh, India.",
        },
      ],
    },

    {
      id: "changes-and-contact",
      heading: "Changes and contact",
      body: [
        {
          type: "p",
          text: "We may update these terms when the website changes; the date at the top shows the current version. Questions can be sent to us here:",
        },
        { type: "contact" },
      ],
    },
  ],
};
