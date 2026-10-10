/**
 * Copy and layout for the hero chapter. Edit words here, not in the component.
 *
 * `records` are the cards floating in the hero. Every one of them is an aggregate summary
 * read from the public stats api - litres over the last 7 days, today, this month, the
 * size of the herd, the number of branches. Nothing about an individual animal, a
 * treatment or a calving is ever shown here. The kinds are defined in
 * components/graphics/CardField.jsx.
 *
 * Positions are percentages of the field box (x from the left, y from the top); z is
 * depth in pixels, negative = further away. Phones get a simpler field: a record with
 * `mobile` is shown there at those positions, one without it is left out.
 */

export const hero = {
  eyebrow: "Smart dairy farm management",
  headline: "Run your dairy farm with clarity, not notebooks.",
  emphasis: "clarity,",
  lead: "Cattle, milk, health and breeding in one living record — for a single farm or a dozen branches.",
  badges: ["Farm data stays private", "Single & multi-branch", "Built for daily use"],
  scrollHint: "Scroll",

  records: [
    { id: "chart", kind: "chart", tone: "soft", x: 34, y: 6, z: 90, rotateY: -5, width: "19rem", mobile: { x: 6, y: 2, width: "88%" } },
    { id: "today", kind: "today", tone: "soft", x: 6, y: 10, z: -120, rotateY: 16, rotateX: -3, width: "13rem", mobile: { x: 2, y: 54, width: "50%" } },
    { id: "herd", kind: "herd", tone: "grass", x: 70, y: 4, z: -40, rotateY: -16, width: "14rem", mobile: { x: 50, y: 48, width: "48%" } },
    { id: "month", kind: "month", tone: "strong", x: 4, y: 60, z: -220, rotateY: 22, width: "13rem", mobile: { x: 24, y: 76, width: "54%" } },
    { id: "best-day", kind: "bestDay", tone: "soft", x: 62, y: 58, z: -160, rotateY: -20, width: "13rem" },
    { id: "daily", kind: "daily", tone: "strong", x: 80, y: 34, z: -300, rotateY: -28, width: "12rem" },
    { id: "branches", kind: "branches", tone: "soft", x: 36, y: 78, z: -120, rotateY: 6, width: "12rem" },
  ],
};
