import { Link } from "react-router-dom";
import MarketingSubpageLayout from "./MarketingSubpageLayout";
import "./PublicSubpage.css";

function PrivacyPolicy() {
  return (
    <MarketingSubpageLayout active={null}>
      <main className="subpage-main">
        <div className="home-container subpage-inner">
          <h1 className="subpage-title">Privacy Policy</h1>
          <p className="subpage-lead">Last updated: April 19, 2026 (sample text)</p>

          <article className="subpage-prose">
            <p>
              This Privacy Policy describes how a generic &ldquo;Career Portal&rdquo;
              demo application may collect, use, and protect information. Replace
              this document with a policy reviewed by your legal and privacy teams
              before production use.
            </p>

            <h2>Information we may collect</h2>
            <ul>
              <li>
                Account details such as name, email address, and profile information
                you choose to provide.
              </li>
              <li>
                Application materials you upload or submit through forms (for
                example résumé files or cover letter text).
              </li>
              <li>
                Technical data such as browser type, device identifiers, and basic
                usage logs to keep the service secure and reliable.
              </li>
            </ul>

            <h2>How we use information</h2>
            <p>
              Information may be used to create and manage accounts, process job
              applications, communicate about your candidacy, improve the portal,
              and meet legal or compliance obligations. We do not sell personal
              information in this sample policy narrative.
            </p>

            <h2>Cookies and similar technologies</h2>
            <p>
              The application may use cookies or local storage for sign-in sessions,
              preferences, and analytics. You can control cookies through your
              browser settings; some features may not work if cookies are disabled.
            </p>

            <h2>Data retention</h2>
            <p>
              Retention periods depend on your organization&rsquo;s rules and
              applicable law. In a real deployment, document how long applications
              and account data are stored and how deletion requests are handled.
            </p>

            <h2>Security</h2>
            <p>
              We use reasonable administrative and technical safeguards appropriate
              to the environment. No method of transmission over the Internet is
              completely secure; use strong passwords and protect your account
              credentials.
            </p>

            <h2>Your choices</h2>
            <p>
              Depending on jurisdiction, you may have rights to access, correct,
              export, or delete your personal data. Contact your portal
              administrator or privacy office for requests.
            </p>

            <h2>Contact</h2>
            <p>
              For privacy questions in this demo, you may use the{" "}
              <Link to="/contact">Contact</Link> page. Replace this section with your
              official privacy contact details.
            </p>

            <p className="subpage-muted">
              Generic placeholder policy — not legal advice.
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

export default PrivacyPolicy;
