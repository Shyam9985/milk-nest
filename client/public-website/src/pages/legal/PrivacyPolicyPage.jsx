import DocumentPage from "../../components/layout/DocumentPage";
import { privacyPolicy } from "../../content/legal/privacy";

/** /privacy - the privacy policy, written in src/content/legal/privacy.js. Title and
 *  description for the route live in config/routes.js. */
export default function PrivacyPolicyPage() {
  return <DocumentPage {...privacyPolicy} />;
}
