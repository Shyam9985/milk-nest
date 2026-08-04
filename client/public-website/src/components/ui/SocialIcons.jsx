/**
 * Brand marks are not part of lucide-react v1, so the four we need are inlined
 * here as plain SVG paths.
 */

const base = "size-[18px]";

export function FacebookIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={base} {...props}>
      <path d="M14 8.5V6.9c0-.7.2-1.1 1.2-1.1H16V3.1A16 16 0 0 0 14.1 3C12 3 10.6 4.3 10.6 6.6v1.9H8.4V11h2.2v8h3.1v-8h2.2l.3-2.5H14Z" />
    </svg>
  );
}

export function InstagramIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={base} {...props}>
      <path d="M12 2.9c2.9 0 3.3 0 4.5.1 1.1 0 1.6.2 2 .4.5.2.9.4 1.3.8.4.4.6.8.8 1.3.2.4.4 1 .4 2 .1 1.2.1 1.6.1 4.5s0 3.3-.1 4.5c0 1.1-.2 1.6-.4 2-.2.5-.4.9-.8 1.3-.4.4-.8.6-1.3.8-.4.2-1 .4-2 .4-1.2.1-1.6.1-4.5.1s-3.3 0-4.5-.1c-1.1 0-1.6-.2-2-.4a3.6 3.6 0 0 1-1.3-.8 3.6 3.6 0 0 1-.8-1.3c-.2-.4-.4-1-.4-2-.1-1.2-.1-1.6-.1-4.5s0-3.3.1-4.5c0-1.1.2-1.6.4-2 .2-.5.4-.9.8-1.3.4-.4.8-.6 1.3-.8.4-.2 1-.4 2-.4 1.2-.1 1.6-.1 4.5-.1Zm0 1.9c-2.8 0-3.2 0-4.3.1-.8 0-1.3.2-1.6.3-.4.1-.7.3-1 .6-.3.3-.5.6-.6 1-.1.3-.2.8-.3 1.6 0 1.1-.1 1.5-.1 4.3s0 3.2.1 4.3c0 .8.2 1.3.3 1.6.1.4.3.7.6 1 .3.3.6.5 1 .6.3.1.8.2 1.6.3 1.1 0 1.5.1 4.3.1s3.2 0 4.3-.1c.8 0 1.3-.2 1.6-.3.4-.1.7-.3 1-.6.3-.3.5-.6.6-1 .1-.3.2-.8.3-1.6 0-1.1.1-1.5.1-4.3s0-3.2-.1-4.3c0-.8-.2-1.3-.3-1.6a2.7 2.7 0 0 0-.6-1 2.7 2.7 0 0 0-1-.6c-.3-.1-.8-.2-1.6-.3-1.1 0-1.5-.1-4.3-.1Zm0 3.2a4.7 4.7 0 1 1 0 9.4 4.7 4.7 0 0 1 0-9.4Zm0 1.9a2.8 2.8 0 1 0 0 5.6 2.8 2.8 0 0 0 0-5.6Zm4.9-3.4a1.1 1.1 0 1 1 0 2.2 1.1 1.1 0 0 1 0-2.2Z" />
    </svg>
  );
}

export function LinkedinIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={base} {...props}>
      <path d="M6.9 5a1.9 1.9 0 1 1-3.8 0 1.9 1.9 0 0 1 3.8 0ZM3.2 8.4h3.5V20H3.2V8.4Zm5.7 0h3.3v1.6h.1c.5-.9 1.6-1.8 3.3-1.8 3.5 0 4.2 2.3 4.2 5.3V20h-3.5v-5.1c0-1.2 0-2.8-1.7-2.8s-2 1.3-2 2.7V20H8.9V8.4Z" />
    </svg>
  );
}

export function YoutubeIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={base} {...props}>
      <path d="M21.6 7.2a2.5 2.5 0 0 0-1.8-1.8C18.2 5 12 5 12 5s-6.2 0-7.8.4a2.5 2.5 0 0 0-1.8 1.8C2 8.8 2 12 2 12s0 3.2.4 4.8a2.5 2.5 0 0 0 1.8 1.8C5.8 19 12 19 12 19s6.2 0 7.8-.4a2.5 2.5 0 0 0 1.8-1.8C22 15.2 22 12 22 12s0-3.2-.4-4.8ZM10 15.1V8.9l5.2 3.1-5.2 3.1Z" />
    </svg>
  );
}

export const socialLinks = [
  { name: "Facebook", Icon: FacebookIcon, href: "#" },
  { name: "Instagram", Icon: InstagramIcon, href: "#" },
  { name: "LinkedIn", Icon: LinkedinIcon, href: "#" },
  { name: "YouTube", Icon: YoutubeIcon, href: "#" },
];
