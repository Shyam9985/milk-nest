import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import logoImage from "./assets/logo.png";
import bannerImage from "./assets/banner.png";
import bannerAltImage from "./assets/banner-1.png";
import "./styles.css";

const navItems = [
  { label: "Home", href: "#home" },
  { label: "Services", href: "#services" },
  { label: "Why Us", href: "#why-us" },
  { label: "Features", href: "#features" },
  { label: "How It Helps", href: "#process" },
  { label: "Contact", href: "#contact" },
];

const services = [
  {
    icon: "CM",
    title: "Cattle Management",
    text: "Keep cattle records, breed details, age, health status, and branch mapping organized.",
  },
  {
    icon: "MP",
    title: "Milk Production",
    text: "Track daily morning and evening production patterns with better visibility.",
  },
  {
    icon: "SE",
    title: "Sales & Expenses",
    text: "Monitor milk sales, farm expenses, payment status, and money movement.",
  },
  {
    icon: "HR",
    title: "Health Records",
    text: "Maintain health checkups, vaccination dates, medicine notes, and follow-ups.",
  },
  {
    icon: "AT",
    title: "Attendance",
    text: "Support daily staff attendance visibility for farm teams and branch managers.",
  },
  {
    icon: "BI",
    title: "Branch Insights",
    text: "Understand operations branch by branch without depending on scattered notebooks.",
  },
];

const reasons = [
  "Designed around everyday dairy farm work",
  "Simple enough for owners and farm teams",
  "Helps reduce manual record confusion",
  "Keeps production, cattle, people, and money connected",
];

const outcomes = [
  { value: "Daily", label: "production visibility" },
  { value: "Branch", label: "wise farm monitoring" },
  { value: "Smart", label: "records for decisions" },
];

const audiences = [
  {
    title: "Farm Owners",
    text: "See the overall direction of production, expenses, staff, and branch activity.",
  },
  {
    title: "Branch Managers",
    text: "Stay close to daily operations without depending on scattered notebooks.",
  },
  {
    title: "Farm Teams",
    text: "Work with simple flows for cattle, milk, attendance, and routine activity records.",
  },
];

const featureHighlights = [
  "Cattle profiles and breed details",
  "Morning and evening milk entries",
  "Sales, expense, and payment visibility",
  "Health, vaccination, and feed records",
  "Staff attendance and branch tracking",
  "Useful reports for farm decisions",
];

const steps = [
  {
    count: "01",
    title: "Record Activity",
    text: "Capture cattle, milk, sales, expenses, feed, and attendance details in one flow.",
  },
  {
    count: "02",
    title: "Monitor Progress",
    text: "View daily operations clearly and notice changes before they become problems.",
  },
  {
    count: "03",
    title: "Improve Decisions",
    text: "Use organized farm information to plan production, cost control, and growth.",
  },
];

function useRevealAnimations() {
  useEffect(() => {
    const elements = Array.from(document.querySelectorAll("[data-reveal]"));

    if (!("IntersectionObserver" in window)) {
      elements.forEach((element) => element.classList.add("is-visible"));
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.16 }
    );

    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, []);
}

function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const closeMenu = () => setMenuOpen(false);

  return (
    <header className={`site-header ${scrolled ? "site-header--scrolled" : ""}`}>
      <a className="brand" href="#home" onClick={closeMenu} aria-label="Milk Nest home">
        <img className="brand-logo" src={logoImage} alt="" />
        <span>Milk Nest</span>
      </a>

      <button
        className="menu-button"
        type="button"
        aria-label="Toggle navigation menu"
        aria-expanded={menuOpen}
        onClick={() => setMenuOpen((current) => !current)}
      >
        <span></span>
        <span></span>
        <span></span>
      </button>

      <nav className={`site-nav ${menuOpen ? "site-nav--open" : ""}`} aria-label="Main navigation">
        {navItems.map((item) => (
          <a key={item.href} href={item.href} onClick={closeMenu}>
            {item.label}
          </a>
        ))}
        <a className="nav-cta" href="#contact" onClick={closeMenu}>
          Contact Us
        </a>
      </nav>
    </header>
  );
}

function App() {
  useRevealAnimations();

  return (
    <>
      <Header />
      <main>
        <section className="hero" id="home">
          <div className="hero-content" data-reveal>
            <p className="eyebrow">Dairy farm operations, simplified</p>
            <h1>Smarter dairy farm monitoring for growing farms</h1>
            <p className="hero-copy">
              Milk Nest helps dairy farm owners and teams organize cattle records, milk
              production, sales, expenses, attendance, and daily farm activity in a clear way.
            </p>
            <div className="hero-actions">
              <a className="button button--primary" href="#contact">
                Contact Us
              </a>
              <a className="button button--secondary" href="#services">
                View Services
              </a>
            </div>
          </div>

          <div className="hero-media" data-reveal>
            <img src={bannerImage} alt="Milk Nest smart dairy farm management banner" />
          </div>
        </section>

        <section className="outcomes" aria-label="Milk Nest outcomes">
          {outcomes.map((item, index) => (
            <div
              className="outcome-item"
              key={item.label}
              data-reveal
              style={{ "--delay": `${index * 80}ms` }}
            >
              <strong>{item.value}</strong>
              <span>{item.label}</span>
            </div>
          ))}
        </section>

        <section className="section services-section" id="services">
          <div className="section-heading" data-reveal>
            <p className="eyebrow">Services</p>
            <h2>Everything a dairy farm needs to stay organized</h2>
            <p>
              The public site presents Milk Nest as a practical operations companion for
              dairy farm owners, managers, and teams.
            </p>
          </div>

          <div className="service-grid">
            {services.map((service, index) => (
              <article
                className="service-card"
                key={service.title}
                data-reveal
                style={{ "--delay": `${index * 70}ms` }}
              >
                <span className="service-icon">{service.icon}</span>
                <h3>{service.title}</h3>
                <p>{service.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="section banner-section" aria-label="Milk Nest branded farm banner">
          <div className="wide-banner" data-reveal>
            <img src={bannerAltImage} alt="Milk Nest cattle management and smart operations banner" />
          </div>
        </section>

        <section className="section why-section" id="why-us">
          <div className="why-panel" data-reveal>
            <p className="eyebrow">Why Milk Nest</p>
            <h2>Built for clarity in daily dairy operations</h2>
            <p>
              Milk Nest is positioned for farms that want less manual confusion and more
              confidence in everyday operational decisions.
            </p>

            <div className="metric-row">
              <div>
                <strong>6+</strong>
                <span>farm areas covered</span>
              </div>
              <div>
                <strong>1</strong>
                <span>clear public message</span>
              </div>
            </div>
          </div>

          <div className="reason-list">
            {reasons.map((reason, index) => (
              <div
                className="reason-item"
                key={reason}
                data-reveal
                style={{ "--delay": `${index * 90}ms` }}
              >
                <span>{String(index + 1).padStart(2, "0")}</span>
                <p>{reason}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="section audience-section">
          <div className="section-heading" data-reveal>
            <p className="eyebrow">Who It Serves</p>
            <h2>Made for the people running the farm every day</h2>
          </div>

          <div className="audience-grid">
            {audiences.map((audience, index) => (
              <article
                className="audience-card"
                key={audience.title}
                data-reveal
                style={{ "--delay": `${index * 80}ms` }}
              >
                <h3>{audience.title}</h3>
                <p>{audience.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="section features-section" id="features">
          <div className="feature-copy" data-reveal>
            <p className="eyebrow">Feature Highlights</p>
            <h2>A public promise focused on organized farm information</h2>
            <p>
              Milk Nest can be presented as a practical system that brings the important
              parts of a dairy farm into one dependable operating view.
            </p>
          </div>

          <div className="feature-list">
            {featureHighlights.map((feature, index) => (
              <div
                className="feature-item"
                key={feature}
                data-reveal
                style={{ "--delay": `${index * 55}ms` }}
              >
                <span>{String(index + 1).padStart(2, "0")}</span>
                <p>{feature}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="section process-section" id="process">
          <div className="section-heading" data-reveal>
            <p className="eyebrow">How It Helps</p>
            <h2>A simple flow for better farm decisions</h2>
          </div>

          <div className="process-grid">
            {steps.map((step, index) => (
              <article
                className="process-card"
                key={step.title}
                data-reveal
                style={{ "--delay": `${index * 90}ms` }}
              >
                <span>{step.count}</span>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="section contact-section" id="contact">
          <div className="contact-copy" data-reveal>
            <p className="eyebrow">Contact Us</p>
            <h2>Start a conversation about your dairy farm</h2>
            <p>
              This public website can guide visitors to reach out for demos, inquiries,
              and partnership conversations.
            </p>
            <div className="contact-details">
              <span>Phone: +91 99854 53023</span>
              <span>Email: hello@milknest.example</span>
              <span>Location: Andhra Pradesh, India</span>
            </div>
          </div>

          <form className="contact-form" data-reveal>
            <label>
              Name
              <input type="text" name="name" placeholder="Your name" />
            </label>
            <label>
              Phone
              <input type="tel" name="phone" placeholder="Phone number" />
            </label>
            <label>
              Farm / Business
              <input type="text" name="farm" placeholder="Farm name" />
            </label>
            <label>
              Message
              <textarea name="message" placeholder="Tell us what you want to manage"></textarea>
            </label>
            <button className="button button--primary" type="button">
              Send Inquiry
            </button>
          </form>
        </section>
      </main>

      <footer className="site-footer">
        <div>
          <a className="brand brand--footer" href="#home" aria-label="Milk Nest home">
            <img className="brand-logo" src={logoImage} alt="" />
            <span>Milk Nest</span>
          </a>
          <p>Public website for a dairy farm operations monitoring project.</p>
        </div>
        <div className="footer-links">
          {navItems.map((item) => (
            <a key={item.href} href={item.href}>
              {item.label}
            </a>
          ))}
        </div>
        <p className="copyright">© 2026 Milk Nest. All rights reserved.</p>
      </footer>
    </>
  );
}

createRoot(document.getElementById("root")).render(<App />);
