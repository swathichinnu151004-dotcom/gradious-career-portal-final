import { Link } from "react-router-dom";
import MarketingSubpageLayout from "./MarketingSubpageLayout";
import "./PublicSubpage.css";

function TermsConditions() {
  return (
    <MarketingSubpageLayout active={null}>
      <main className="subpage-main">
        <div className="home-container subpage-inner">
          <h1 className="subpage-title">Terms &amp; Conditions</h1>
          <p className="subpage-lead">Last updated: April 19, 2026 (sample text)</p>

          <article className="subpage-prose">
            <p>
              These Terms &amp; Conditions govern use of this generic Career Portal
              demonstration. By accessing or using the portal, you agree to these
              terms insofar as they apply to a non-production or sample deployment.
              Replace with counsel-approved terms for live systems.
            </p>

            <h2>Eligibility and accounts</h2>
            <p>
              You must provide accurate registration information and keep your
              credentials confidential. You are responsible for activity that occurs
              under your account. Notify your administrator if you suspect
              unauthorized access.
            </p>

            <h2>Acceptable use</h2>
            <ul>
              <li>Do not attempt to disrupt, overload, or compromise the service.</li>
              <li>
                Do not upload malicious files, unlawful content, or material you do
                not have rights to share.
              </li>
              <li>
                Respect confidentiality of unpublished roles and internal hiring
                information where applicable.
              </li>
            </ul>

            <h2>Applications and decisions</h2>
            <p>
              Submitting an application does not guarantee employment. Screening,
              interviews, and offers are managed by your organization according to
              its own policies and applicable law.
            </p>

            <h2>Intellectual property</h2>
            <p>
              Portal software, branding, and documentation may be owned by licensors
              or your employer. Unless expressly permitted, you may not copy, modify,
              or distribute underlying code or assets outside agreed terms.
            </p>

            <h2>Disclaimer of warranties</h2>
            <p>
              The service is provided on an &ldquo;as is&rdquo; and &ldquo;as
              available&rdquo; basis for demonstration. To the maximum extent permitted
              by law, warranties of merchantability or fitness for a particular purpose
              are disclaimed unless otherwise required by law.
            </p>

            <h2>Limitation of liability</h2>
            <p>
              To the extent permitted by law, the portal operators are not liable for
              indirect, incidental, or consequential damages arising from use of
              this sample application. Real contracts should be drafted by qualified
              counsel.
            </p>

            <h2>Changes to these terms</h2>
            <p>
              We may update these terms from time to time. Continued use after
              changes constitutes acceptance of the revised terms, subject to local
              consumer protection rules.
            </p>

            <h2>Contact</h2>
            <p>
              Questions about these terms in this demo can be directed via the{" "}
              <Link to="/contact">Contact</Link> page.
            </p>

            <p className="subpage-muted">
              Generic placeholder terms — not legal advice.
            </p>
          </article>

          <p className="subpage-back">
            <Link to="/">← Back to Career Portal</Link>
          </p>
        </div>
      </main>
    </MarketingSubpageLayout>
  );
}

export default TermsConditions;
