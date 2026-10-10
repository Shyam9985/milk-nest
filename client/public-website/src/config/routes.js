/**
 * The pages of the site and the <title> / description each one sets. The components
 * themselves are wired in app/App.jsx; this file is the part a non-developer may edit.
 */
export const routes = {
  "/": {
    title: "Milk Nest | Smart Dairy Farm Management",
    description:
      "Milk Nest is a smart dairy farm management platform — cattle records, milk production, health treatments, and breeding in one clear view for single and multi-branch farms.",
  },
  "/privacy": {
    title: "Privacy Policy | Milk Nest",
    description:
      "What the Milk Nest website collects (enquiry details, browser preferences, aggregate live figures), why, how long it is kept, and how to ask about it.",
  },
  "/terms": {
    title: "Terms & Conditions | Milk Nest",
    description:
      "The terms and conditions for using the Milk Nest public website: enquiries, live figures, intellectual property, liability and governing law.",
  },
  "/application-privacy": {
    title: "Application Privacy Notice | Milk Nest",
    description:
      "How the Milk Nest application handles the accounts of the people who use it and the farm records their business enters.",
  },
};

export const notFoundRoute = {
  title: "Page not found | Milk Nest",
  description: "There is nothing at this address. Head back to the Milk Nest home page, or get in touch.",
};
