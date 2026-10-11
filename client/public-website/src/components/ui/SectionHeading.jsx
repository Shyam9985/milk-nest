import MaskedText from "./MaskedText";
import Reveal from "./Reveal";

/**
 * The centred heading block that opens a chapter: a display-serif title that rises in
 * word by word (with an italic emphasis), and an optional lead paragraph. The
 * chapter's name and number are the corner labels drawn by Chapter, so there is no
 * eyebrow here.
 */
export default function SectionHeading({ title, emphasis, copy, className = "" }) {
  return (
    <div className={`mx-auto max-w-4xl text-center ${className}`}>
      <MaskedText as="h2" text={title} emphasis={emphasis} delay={0.1} className="text-headline" />
      {copy ? (
        <Reveal as="p" delay={0.3} className="mx-auto mt-6 max-w-2xl text-lead text-muted">
          {copy}
        </Reveal>
      ) : null}
    </div>
  );
}
