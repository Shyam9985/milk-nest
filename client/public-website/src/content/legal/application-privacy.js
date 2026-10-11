/**
 * The privacy notice for the Milk Nest application (the portal farms use every day), as
 * the blocks DocumentPage renders. It describes the system as built: accounts and
 * sessions, login history and audit logs, the emails the system sends, and the farm
 * records that belong to each customer. The portal's signup and login screens should
 * link to it. When the system changes, change the matching paragraph and `updatedOn`.
 */
export const applicationPrivacy = {
  eyebrow: "Application Privacy Notice",
  title: "How the application handles your data.",
  emphasis: "your data.",
  updatedOn: "10 October 2026",
  intro: "For the people who sign in to Milk Nest: your account, the records your farm enters, and what we keep about how the system is used.",

  sections: [
    {
      id: "draft-notice",
      body: [
        {
          type: "note",
          text: "Draft for review by the Milk Nest team before publishing; not yet in force. To settle first: the server location, and hashed-only password storage.",
        },
      ],
    },

    {
      id: "two-kinds-of-data",
      heading: "Two kinds of data",
      body: [
        {
          type: "p",
          text: "Account data is about you, the person signing in; we are responsible for it. Farm records are the cattle, milk, health, breeding and branch entries your business makes; they belong to the customer whose farm it is, and we process them only on that customer's instructions. Animals and litres are not personal data, but names typed into records are.",
        },
      ],
    },

    {
      id: "your-account",
      heading: "Your account",
      body: [
        {
          type: "p",
          text: "We store your name, username, email address, mobile number, role, the farms or branches you may see, and a profile photo if you upload one. Your password is checked against a salted hash; account managers can reset it but not read it. Signing in starts a session that expires on its own, and repeated wrong passwords lock the account for a while.",
        },
      ],
    },

    {
      id: "what-the-system-records",
      heading: "What the system records",
      body: [
        { type: "p", text: "To keep the application secure and show who changed what, the system keeps:" },
        {
          type: "list",
          items: [
            "a login history: time, IP address and device of each sign-in",
            "an audit log: who created, changed or deleted which record, when and from where, with the values before and after (secrets blanked out)",
            "a log of the emails sent to you, such as one-time codes and password resets",
            "server request logs, kept briefly",
          ],
        },
        {
          type: "p",
          text: "Farm owners and managers can see the audit trail for their own farm. We look at these records only to keep the service running, investigate a problem you report, or respond to misuse.",
        },
      ],
    },

    {
      id: "farm-records",
      heading: "Farm records",
      body: [
        {
          type: "p",
          text: "The records your business enters stay your business's. We use them to run the application for you and for nothing else: never sold, never shared with other farms, never used to build products of our own. The live figures on our public website are totals across all farms with nothing identifiable. When a customer's agreement ends, its records are returned or deleted as agreed and its staff accounts are closed.",
        },
      ],
    },

    {
      id: "emails-and-sharing",
      heading: "Emails and sharing",
      body: [
        {
          type: "p",
          text: "The application emails you only about your account: verification codes, password resets and account notices, sent through an email service acting on our instructions. Our hosting, database and email providers act on our instructions and may not use the data themselves. What you can see is set by your role within your farm. We disclose data to a third party only when the law requires it.",
        },
      ],
    },

    {
      id: "retention-and-rights",
      heading: "Retention and your rights",
      body: [
        {
          type: "p",
          text: "Account data is kept while the account is active and for a reasonable period after it is closed, so the audit trail stays complete; logs are kept while the customer's agreement runs; farm records follow the agreement. Under India's Digital Personal Data Protection Act, 2023 you can ask what we hold about you and have it corrected or deleted. Most account details you can change yourself; for anything else, ask your farm's account owner or contact us below. If you are not satisfied, you can raise it with the Data Protection Board of India.",
        },
      ],
    },

    {
      id: "security",
      heading: "Security",
      body: [
        {
          type: "p",
          text: "The application is served over HTTPS. Access is by role, database access is split between accounts with the least rights needed, every change is audited, sign-in attempts are limited and sessions expire. If we learn of a breach that affects you, we will tell you and your farm's account owner.",
        },
      ],
    },

    {
      id: "changes-and-contact",
      heading: "Changes and contact",
      body: [
        {
          type: "p",
          text: "When the application changes in a way that affects your data, we update this notice; the date at the top shows the current version. The public website has its own [privacy policy](/privacy). Questions and requests can be sent to us here:",
        },
        { type: "contact" },
      ],
    },
  ],
};
