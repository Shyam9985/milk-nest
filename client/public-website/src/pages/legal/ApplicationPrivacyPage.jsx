import DocumentPage from "../../components/layout/DocumentPage";
import { applicationPrivacy } from "../../content/legal/application-privacy";

/** /application-privacy - how the Milk Nest application itself handles data, written in
 *  src/content/legal/application-privacy.js. Linked from the website's privacy policy
 *  and meant to be linked from the portal's signup and login screens as well. */
export default function ApplicationPrivacyPage() {
  return <DocumentPage {...applicationPrivacy} />;
}
