import { Link } from "react-router-dom";
import MarketingSubpageLayout from "./MarketingSubpageLayout";
import "./PublicSubpage.css";

function Contact() {
  return (
    <MarketingSubpageLayout active="contact">
      <main className="subpage-main">
        <div className="home-container subpage-inner subpage-inner--narrow">
          <h1 className="subpage-title">Contact Us</h1>
          <p className="subpage-lead">
            Reach the right team for job and HR questions or sales inquiries.
          </p>

          <div className="subpage-cards">
            <section className="subpage-card" aria-labelledby="contact-hr-heading">
              <h2 id="contact-hr-heading" className="subpage-card-title">
                Job / HR related Queries
              </h2>
              <p className="subpage-row">
                <span className="subpage-icon" aria-hidden>
                  📞
                </span>
                <a href="tel:+918125710653">+91 81257 10653</a>
              </p>
              <p className="subpage-row">
                <span className="subpage-icon" aria-hidden>
                  📧
                </span>
                <a href="mailto:hr@gradious.com">hr@gradious.com</a>
              </p>
            </section>

            <section className="subpage-card" aria-labelledby="contact-sales-heading">
              <h2 id="contact-sales-heading" className="subpage-card-title">
                Sales
              </h2>
              <p className="subpage-row">
                <span className="subpage-icon" aria-hidden>
                  📞
                </span>
                <a href="tel:+918309300259">+91 83093 00259</a>
              </p>
              <p className="subpage-row">
                <span className="subpage-icon" aria-hidden>
                  📧
                </span>
                <a href="mailto:sales@gradious.com">sales@gradious.com</a>
              </p>
            </section>
          </div>

          <p className="subpage-back">
            <Link to="/">← Back to Career Portal</Link>
          </p>
        </div>
      </main>
    </MarketingSubpageLayout>
  );
}

export default Contact;
