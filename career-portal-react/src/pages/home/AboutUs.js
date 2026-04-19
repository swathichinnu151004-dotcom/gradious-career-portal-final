import { Link } from "react-router-dom";
import MarketingSubpageLayout from "./MarketingSubpageLayout";
import "./PublicSubpage.css";

function AboutUs() {
  return (
    <MarketingSubpageLayout active="about">
      <main className="subpage-main">
        <div className="home-container subpage-inner">
          <h1 className="subpage-title">About Us</h1>
          <p className="subpage-lead">
            Generic overview of the Career Portal for demonstration purposes.
          </p>

          <article className="subpage-prose">
            <h2>Our mission</h2>
            <p>
              This Career Portal is a sample application that helps organizations
              showcase job openings, manage applications, and give candidates a
              simple way to explore opportunities in one place.
            </p>

            <h2>What you can do here</h2>
            <ul>
              <li>Browse published roles and read role descriptions.</li>
              <li>Create an account to apply and track your applications.</li>
              <li>Learn more about teams and hiring areas across the company.</li>
            </ul>

            <h2>Who we serve</h2>
            <p>
              The portal is intended for internal and external candidates, hiring
              managers, and recruiters who need a single hub for recruitment
              workflows. Names, numbers, and policies on this demo site are
              placeholders unless configured by your organization.
            </p>

            <h2>Technology &amp; trust</h2>
            <p>
              We aim to provide a secure, modern experience. For production use,
              your administrators should connect real data sources, configure
              authentication, and replace any sample text with approved content.
            </p>

            <p className="subpage-muted">
              This page contains generic placeholder copy for development and
              testing only.
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

export default AboutUs;
