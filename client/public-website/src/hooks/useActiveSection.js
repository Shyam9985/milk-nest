import { useEffect, useState } from "react";
import { chapterIds } from "../config/chapters";

/** The id of the chapter that currently owns the middle of the viewport. */
export default function useActiveSection() {
  const [active, setActive] = useState(chapterIds[0]);

  useEffect(() => {
    const sections = chapterIds.map((id) => document.getElementById(id)).filter(Boolean);

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(entry.target.id);
        });
      },
      /* a thin band across the middle of the screen: whichever chapter crosses it is active */
      { rootMargin: "-45% 0px -50% 0px" }
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  return active;
}
