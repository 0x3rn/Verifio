import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <div className="page-container">
      <article className="legal-page">
        <h1 className="legal-page__title">Privacy Policy</h1>
        <p className="legal-page__updated">Last updated: September 8, 2026</p>

        <p className="legal-page__text">
          Verifio (&quot;Verifio,&quot; &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) provides SMS verification, voice verification, and temporary phone-number rental services. This Privacy Policy explains what information we collect, how we use it, when we share it, how long we retain it, and the choices available to you when you use our website, applications, APIs, and related services (collectively, the &quot;Service&quot;).
        </p>
        <p className="legal-page__text">
          By using the Service, you acknowledge that you have read this Policy. This Policy should be read together with our <Link href="/terms">Terms of Service</Link>. If you do not agree with this Policy, please do not create an account or use the Service.
        </p>
        <p className="legal-page__text">
          This Policy is a general description of our current practices. Privacy obligations can vary depending on where you live, the structure of our business, the providers we use, and the services we offer. Before publication, the operator of Verifio should confirm the legal entity name, contact details, retention periods, and regional disclosures with qualified privacy counsel.
        </p>

        <h2 className="legal-page__heading">1. Who We Are and What This Policy Covers</h2>
        <p className="legal-page__text">
          Verifio is the entity responsible for deciding why and how personal information is processed in connection with the Service, except where a third-party provider processes information under its own privacy notice. This Policy applies to information collected through verifio.com, the Verifio dashboard, customer-support channels, and other pages or services that link to this Policy.
        </p>
        <p className="legal-page__text">
          The Service may connect with independent third parties that provide authentication, analytics, hosting, payment processing, messaging, and phone-number provisioning. Those providers may process information under their own terms and privacy notices. We encourage you to review their policies before using any third-party feature.
        </p>

        <h2 className="legal-page__heading">2. Information We Collect</h2>
        <h3 className="legal-page__subheading">2.1 Information you provide directly</h3>
        <p className="legal-page__text">Depending on how you use the Service, we may collect:</p>
        <ul className="legal-page__list">
          <li><strong>Account information:</strong> your name or username, email address, account identifier, authentication records, and preferences.</li>
          <li><strong>Support and communications:</strong> the subject and contents of messages you send us, attachments you choose to provide, and information needed to respond to your request.</li>
          <li><strong>Verification requests:</strong> the service or platform selected, country, verification type, order details, status, phone number issued, and related timestamps.</li>
          <li><strong>Rental information:</strong> the rented number, selected rental plan, rental period, messages or codes received through that number, and rental status.</li>
          <li><strong>Payment and billing information:</strong> amount, currency, payment status, invoice identifiers, provider transaction identifiers, and account-balance history. Payment providers may collect card, bank, cryptocurrency, wallet, and identity information directly under their own policies; we do not intend to store full payment-card numbers or private wallet keys.</li>
          <li><strong>Identity or compliance information:</strong> information we reasonably need to investigate fraud, abuse, chargebacks, sanctions concerns, or legal requests, where applicable.</li>
        </ul>

        <h3 className="legal-page__subheading">2.2 Information collected automatically</h3>
        <p className="legal-page__text">When you browse or use the Service, we may automatically receive:</p>
        <ul className="legal-page__list">
          <li>IP address, approximate location derived from IP, browser type, operating system, device type, language, and time zone.</li>
          <li>Pages, screens, features, links, and buttons you view or use, together with the date and time of those actions.</li>
          <li>Referring and exit pages, session information, performance data, error reports, and diagnostic logs.</li>
          <li>Identifiers stored in cookies, local storage, or similar technologies, subject to your browser and regional settings.</li>
          <li>Security signals such as failed sign-in attempts, rate-limit events, suspicious activity indicators, and information about the integrity of requests.</li>
        </ul>

        <h3 className="legal-page__subheading">2.3 Information we receive from others</h3>
        <p className="legal-page__text">
          We may receive information from authentication providers, payment providers, phone-number and messaging providers, analytics providers, fraud-prevention services, hosting providers, and public sources. This may include a provider user ID, payment status, provider reference, delivery status, fraud signal, or information needed to reconcile a transaction. We may also receive information when another person contacts us about an account or transaction.
        </p>

        <h3 className="legal-page__subheading">2.4 Sensitive information</h3>
        <p className="legal-page__text">
          The Service is not designed to request health information, biometric data, precise geolocation, government identification numbers, or other highly sensitive information except where reasonably necessary for a documented compliance or support process. Please do not submit sensitive information through ordinary support forms unless we specifically request it through a secure channel.
        </p>

        <h2 className="legal-page__heading">3. How We Use Information</h2>
        <p className="legal-page__text">We use information for the following business and operational purposes:</p>
        <ul className="legal-page__list">
          <li>To create, authenticate, maintain, and secure your account.</li>
          <li>To provision phone numbers, deliver SMS or voice verification services, display received codes, and manage rentals.</li>
          <li>To process payments, maintain balances, issue invoices, prevent duplicate credits, investigate disputes, and detect payment abuse.</li>
          <li>To provide customer support, respond to questions, send service notices, and communicate about account or order activity.</li>
          <li>To operate, maintain, troubleshoot, monitor, and improve the Service and its reliability.</li>
          <li>To personalize the experience, understand feature usage, measure performance, and test product improvements.</li>
          <li>To prevent fraud, spam, abuse, unauthorized access, account takeover, illegal activity, and violations of our Terms.</li>
          <li>To enforce our agreements, protect the rights and safety of users and third parties, and establish or defend legal claims.</li>
          <li>To comply with court orders, lawful requests, tax obligations, regulatory requirements, and other legal duties.</li>
          <li>For other purposes disclosed at the time of collection or with your consent.</li>
        </ul>

        <h2 className="legal-page__heading">4. Legal Bases for Processing</h2>
        <p className="legal-page__text">
          Where a data-protection law requires a legal basis, we generally rely on one or more of the following: performance of a contract when we provide the Service you request; legitimate interests when we operate, secure, improve, and support the Service; compliance with a legal obligation; and consent where we ask for it. Our legitimate interests may include preventing misuse, keeping the platform reliable, protecting users, and communicating essential service information. Where we rely on consent, you may withdraw it at any time, although withdrawal does not affect processing that occurred before withdrawal or processing based on another lawful basis.
        </p>

        <h2 className="legal-page__heading">5. How We Share Information</h2>
        <p className="legal-page__text">We do not sell your personal information for money. We may disclose information in the following limited circumstances:</p>
        <ul className="legal-page__list">
          <li><strong>Service providers and processors:</strong> companies that host databases and applications, provide authentication, deliver analytics, process payments, send communications, provide customer support, or help us prevent fraud and abuse.</li>
          <li><strong>Phone-number and messaging providers:</strong> providers that supply numbers, route SMS or voice traffic, retrieve verification messages, or report delivery and order status. We share only the information reasonably needed to fulfill the requested verification service.</li>
          <li><strong>Professional advisers:</strong> lawyers, accountants, auditors, insurers, and consultants who are subject to confidentiality or professional obligations.</li>
          <li><strong>Legal and safety disclosures:</strong> courts, regulators, law-enforcement authorities, or other parties when we reasonably believe disclosure is required or necessary to prevent harm, fraud, abuse, or unlawful conduct.</li>
          <li><strong>Business transfers:</strong> a buyer, investor, successor, or adviser in connection with a merger, financing, acquisition, reorganization, sale of assets, or similar transaction.</li>
          <li><strong>With your direction or consent:</strong> when you ask us to share information or clearly authorize a particular disclosure.</li>
          <li><strong>Aggregated or de-identified information:</strong> information that has been combined or altered so it is not reasonably capable of identifying you, for analytics, reporting, security, or product-development purposes.</li>
        </ul>
        <p className="legal-page__text">
          We require service providers to process information only for authorized purposes and to apply appropriate confidentiality and security measures. Providers may, however, be independently responsible for their own processing under their own policies.
        </p>

        <h2 className="legal-page__heading">6. Third-Party Services Used by Verifio</h2>
        <p className="legal-page__text">
          The Service may use third-party infrastructure and integrations, including Clerk for authentication, PostHog for product analytics where enabled, Neon or another database host for application data, Cryptomus or another payment provider for cryptocurrency payments, and phone-number or messaging providers such as SMSpool or TextVerified. The exact providers may change as the Service develops. Their access is limited to the information needed for the function they provide, and their own privacy notices govern their independent processing.
        </p>

        <h2 className="legal-page__heading">7. Cookies and Similar Technologies</h2>
        <p className="legal-page__text">We use cookies, local storage, and similar technologies to keep users signed in, maintain security, remember preferences, understand how the Service is used, and measure performance. These technologies may include:</p>
        <ul className="legal-page__list">
          <li><strong>Strictly necessary technologies:</strong> authentication, session continuity, security, routing, load balancing, and core functionality.</li>
          <li><strong>Preference technologies:</strong> settings such as theme or other choices you make.</li>
          <li><strong>Analytics technologies:</strong> aggregated or pseudonymous information about page views, feature use, and performance where analytics are enabled.</li>
        </ul>
        <p className="legal-page__text">
          You can control cookies through your browser settings and, where available, our consent controls. Blocking necessary cookies may prevent sign-in or core features from working. We do not treat a browser&apos;s &quot;Do Not Track&quot; signal as a universal opt-out where the law does not require us to do so, but we will honor legally required preference signals where applicable.
        </p>

        <h2 className="legal-page__heading">8. Data Retention</h2>
        <p className="legal-page__text">
          We retain information only for as long as reasonably necessary for the purposes described in this Policy, including to provide the Service, maintain business and financial records, resolve disputes, enforce agreements, prevent abuse, and meet legal obligations. Retention depends on the type and sensitivity of the information, the reason it was collected, the likelihood of a legal or support issue, and technical or provider limitations.
        </p>
        <ul className="legal-page__list">
          <li>Account and authentication information is generally retained while your account is active and for a reasonable period afterward.</li>
          <li>Verification orders, statuses, phone numbers, and associated code data are currently designed to be retained for approximately 90 days after completion, unless a longer period is required for security, disputes, legal obligations, or provider reconciliation.</li>
          <li>Payment, tax, fraud, and accounting records may be retained for longer periods where required by law or reasonably necessary to protect against disputes and abuse.</li>
          <li>Backups and security logs may persist for a limited additional period before they are securely deleted or overwritten.</li>
        </ul>
        <p className="legal-page__text">When information is no longer needed, we may delete it, anonymize it, or securely isolate it until deletion is practical. Deletion from active systems may not immediately remove information from backups or records we must retain.</p>

        <h2 className="legal-page__heading">9. Security</h2>
        <p className="legal-page__text">
          We use administrative, technical, and organizational safeguards designed to protect personal information against accidental loss and unauthorized access, use, alteration, or disclosure. These measures may include managed authentication, encrypted connections, access controls, rate limits, origin checks, monitoring, provider due diligence, and security reviews.
        </p>
        <p className="legal-page__text">
          No website, network, storage system, or transmission method is completely secure. You are responsible for protecting your credentials, using a unique password where applicable, and notifying us promptly if you believe your account has been compromised. We will investigate suspected incidents and provide notices when required by applicable law.
        </p>

        <h2 className="legal-page__heading">10. International Processing and Transfers</h2>
        <p className="legal-page__text">
          Verifio and its providers may process information in countries other than the country where you live. Those countries may have different data-protection rules. When required, we use appropriate safeguards for international transfers, which may include contractual protections, adequacy decisions, or another lawful transfer mechanism. By using the Service, you understand that your information may be processed internationally as described in this Policy.
        </p>

        <h2 className="legal-page__heading">11. Your Privacy Rights and Choices</h2>
        <p className="legal-page__text">
          Depending on your location and applicable law, you may have the right to request access to, correction of, deletion of, restriction of, or portability of your personal information. You may also have the right to object to certain processing, withdraw consent, opt out of marketing communications, or complain to a data-protection authority.
        </p>
        <p className="legal-page__text">
          To make a request, contact us through the <Link href="/contact">Contact Us</Link> page and describe the request clearly. We may need to verify your identity before completing it. We may decline or limit a request where permitted by law, including where fulfilling it would affect another person&apos;s rights, reveal confidential information, compromise security, or conflict with a legal obligation. If we deny a request, we will explain the reason where required and provide any appeal process available under applicable law.
        </p>
        <ul className="legal-page__list">
          <li><strong>Account choices:</strong> you may review or update certain account information through the dashboard or by contacting support.</li>
          <li><strong>Marketing choices:</strong> you may unsubscribe from non-essential promotional messages by using the link in the message or contacting us. We may still send transactional and security notices.</li>
          <li><strong>Cookie choices:</strong> you may manage optional cookies through your browser or available consent controls.</li>
          <li><strong>Account deletion:</strong> you may ask us to close your account and delete information that we are not required to retain. Closing an account may not reverse completed transactions or remove records that must be preserved.</li>
        </ul>

        <h2 className="legal-page__heading">12. Regional Disclosures</h2>
        <h3 className="legal-page__subheading">12.1 European Economic Area, United Kingdom, and Switzerland</h3>
        <p className="legal-page__text">
          If you are in the EEA, the United Kingdom, or Switzerland, you may have rights under local data-protection law, including access, rectification, erasure, restriction, portability, objection, and the right to withdraw consent. You may lodge a complaint with your local supervisory authority. If you provide information that we obtain from another organization, we will provide additional information about the source where required.
        </p>
        <h3 className="legal-page__subheading">12.2 United States state privacy laws</h3>
        <p className="legal-page__text">
          Some U.S. states provide additional rights, such as the right to know or access categories of personal information, delete information, correct information, opt out of certain targeted advertising or profiling, and appeal a decision about a request. We do not knowingly sell personal information for monetary consideration. If a state law applies to you, submit a request through our <Link href="/contact">Contact Us</Link> page and identify your state so we can apply the appropriate process.
        </p>

        <h2 className="legal-page__heading">13. Children&apos;s Privacy</h2>
        <p className="legal-page__text">
          The Service is not directed to children under 13, or the higher minimum age required in the relevant jurisdiction. We do not knowingly collect personal information from children who are below the applicable age. If you believe a child has provided information to us, please contact us so we can investigate and delete it where appropriate.
        </p>

        <h2 className="legal-page__heading">14. Third-Party Links and Services</h2>
        <p className="legal-page__text">
          The Service may contain links to websites, platforms, or services operated by third parties. A link does not mean we endorse or control the destination. Information you provide to a third party is governed by that party&apos;s terms and privacy notice, not this Policy. Please review those materials before submitting information or completing a transaction.
        </p>

        <h2 className="legal-page__heading">15. Changes to This Privacy Policy</h2>
        <p className="legal-page__text">
          We may update this Policy when our practices, providers, technology, or legal obligations change. We will post the revised version on this page and update the &quot;Last updated&quot; date. If a change is material, we may provide additional notice through the Service or by email where appropriate. Your continued use after the effective date of a revised Policy means the revised Policy applies to your continued use, subject to applicable law.
        </p>

        <h2 className="legal-page__heading">16. Contact Us</h2>
        <p className="legal-page__text">
          If you have questions, want to exercise a privacy right, or believe we have handled your information improperly, please use our <Link href="/contact">Contact Us</Link> page. Include enough detail for us to understand and respond to your request, but do not include passwords, private keys, full payment credentials, or verification codes unless we specifically request them through a secure process.
        </p>
      </article>
    </div>
  );
}
