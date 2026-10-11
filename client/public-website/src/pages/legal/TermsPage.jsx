import DocumentPage from "../../components/layout/DocumentPage";
import { terms } from "../../content/legal/terms";

/** /terms - the terms of use, written in src/content/legal/terms.js. Title and
 *  description for the route live in config/routes.js. */
export default function TermsPage() {
  return <DocumentPage {...terms} />;
}
