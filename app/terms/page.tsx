import Link from 'next/link';

export default function TermsPage() {
  return (
    <div className="page-container">
      <article className="legal-page">
        <h1 className="legal-page__title">Terms of Service</h1>
        <p className="legal-page__updated">Last updated: September 8, 2026</p>

        <p className="legal-page__text">
          These Terms of Service (&quot;Terms&quot;) form a legally binding agreement between you and Verifio (&quot;Verifio,&quot; &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) governing your access to and use of the Verifio website, applications, APIs, dashboard, SMS verification, residential proxy, phone-number rental, payment, and support services (collectively, the &quot;Service&quot;).
        </p>
        <p className="legal-page__text">
          By creating an account, clicking to accept these Terms, placing an order, or accessing or using the Service, you agree to be bound by these Terms and our <Link href="/privacy">Privacy Policy</Link>. If you do not agree, do not create an account or use the Service.
        </p>
        <p className="legal-page__text">
          These Terms are a general business template and should be reviewed before publication to confirm Verifio&apos;s legal entity, governing law, dispute forum, refund rules, age requirement, and other jurisdiction-specific requirements.
        </p>

        <h2 className="legal-page__heading">1. Definitions</h2>
        <ul className="legal-page__list">
          <li><strong>&quot;Account&quot;</strong> means the user profile created to access authenticated features of the Service.</li>
          <li><strong>&quot;Code&quot;</strong> means an SMS verification code received through a number provisioned by the Service.</li>
          <li><strong>&quot;Content&quot;</strong> means text, data, messages, communications, feedback, and other materials submitted to or generated through the Service.</li>
          <li><strong>&quot;Order&quot;</strong> means a request for one-time verification, proxy access, a rental number, or another related paid feature.</li>
          <li><strong>&quot;Provider&quot;</strong> means a third-party company that supplies phone numbers, messaging, proxy, hosting, authentication, analytics, payment, or other infrastructure used by Verifio.</li>
          <li><strong>&quot;Rental&quot;</strong> means a temporary assignment of a phone number for the plan and period displayed at checkout.</li>
          <li><strong>&quot;You&quot;</strong> or <strong>&quot;User&quot;</strong> means the person or legal entity accessing or using the Service.</li>
        </ul>

        <h2 className="legal-page__heading">2. Eligibility and Authority</h2>
        <p className="legal-page__text">
          You must be at least 13 years old, or the higher minimum age required where you live, to use the Service. If you are under the age of majority, you may use the Service only with the involvement and permission of a parent or legal guardian who agrees to these Terms. You may not use the Service if applicable law prohibits you from doing so.
        </p>
        <p className="legal-page__text">
          If you accept these Terms for a company, organization, or other legal entity, you represent that you have authority to bind that entity. In that case, &quot;you&quot; includes both you and that entity, and the entity is responsible for your use of the Service.
        </p>

        <h2 className="legal-page__heading">3. Accounts and Account Security</h2>
        <p className="legal-page__text">
          Some features require an Account. You agree to provide accurate, current, and complete information and to keep it updated. You may not impersonate another person, create an Account for someone else without authorization, or use an email address or identity that you do not control.
        </p>
        <ul className="legal-page__list">
          <li>You are responsible for maintaining the confidentiality of your sign-in credentials and for activity conducted through your Account.</li>
          <li>You must use reasonable security practices, including a unique password where applicable and protection of authentication devices and recovery methods.</li>
          <li>You must notify us promptly through the <Link href="/contact">Contact Us</Link> page if you suspect unauthorized access, credential compromise, or a fraudulent transaction.</li>
          <li>We may require additional verification, restrict activity, or suspend access when reasonably necessary to protect the Service, users, or Providers.</li>
          <li>You may not sell, rent, share, transfer, or permit unauthorized access to your Account.</li>
        </ul>

        <h2 className="legal-page__heading">4. The Verification Services</h2>
        <p className="legal-page__text">
          Verifio provides access to phone numbers and related delivery infrastructure so that you can receive verification communications from supported third-party platforms. Available services, countries, platforms, number types, prices, delivery times, and limits may change without notice.
        </p>
        <h3 className="legal-page__subheading">4.1 One-time SMS verification</h3>
        <p className="legal-page__text">
          A one-time SMS Order provides a number for a limited verification window. The number may be unavailable, rejected by the target platform, delayed, or unable to receive a message. A number is not guaranteed to work with a particular platform, account, region, or use case. Once an Order expires or is completed, the number may be released and you must not expect continued access to it.
        </p>
        <h3 className="legal-page__subheading">4.2 Residential proxy access</h3>
        <p className="legal-page__text">
          A proxy package provides access to the bandwidth, connection details, and period shown at purchase. Proxy performance, location, availability, routing, target-site acceptance, and throughput depend on the Provider and the destinations you access. You are responsible for securing the credentials, using the connection lawfully, and stopping use when the package expires or is cancelled.
        </p>
        <h3 className="legal-page__subheading">4.3 Rental numbers</h3>
        <p className="legal-page__text">
          A Rental gives you access to a number for the selected plan and period. Rental numbers remain subject to carrier, Provider, country, and platform limitations. A Rental does not transfer ownership of the number to you. We may replace or withdraw a number where reasonably necessary, including because of carrier action, abuse, legal requirements, or Provider limitations.
        </p>

        <h2 className="legal-page__heading">5. Acceptable Use</h2>
        <p className="legal-page__text">
          You may use the Service only for lawful, authorized, and legitimate purposes. You are solely responsible for the platforms, accounts, websites, transactions, and communications connected to your use of a number or Code.
        </p>
        <p className="legal-page__text">You must not use or attempt to use the Service to:</p>
        <ul className="legal-page__list">
          <li>Access, create, recover, verify, or control an account that you do not own or are not authorized to administer.</li>
          <li>Commit, facilitate, conceal, or promote fraud, phishing, impersonation, identity theft, scams, money laundering, sanctions evasion, or other unlawful conduct.</li>
          <li>Evade security controls, age or identity checks, rate limits, bans, anti-abuse systems, platform rules, or account restrictions.</li>
          <li>Send spam, bulk unsolicited messages, threats, harassment, malware, deceptive content, or content that infringes another person&apos;s rights.</li>
          <li>Operate bots, scripts, crawlers, scraping tools, credential-stuffing tools, or automated workflows that place unreasonable load on the Service or a Provider.</li>
          <li>Probe, scan, test, reverse engineer, decompile, disassemble, or attempt to discover source code, vulnerabilities, credentials, or non-public interfaces.</li>
          <li>Interfere with the Service, defeat security measures, bypass a usage limit, or access data belonging to another User.</li>
          <li>Use a phone number or Code in a way that violates the rules of the target platform, applicable carrier policies, or applicable law.</li>
          <li>Resell, sublicense, broker, or commercially redistribute access to the Service without our written permission.</li>
          <li>Submit passwords, payment credentials, private keys, or unnecessary sensitive information to ordinary support channels.</li>
        </ul>
        <p className="legal-page__text">
          We may investigate suspected misuse and take proportionate action, including cancelling an Order, withholding a refund, limiting features, preserving relevant records, reporting activity, or suspending or terminating an Account.
        </p>

        <h2 className="legal-page__heading">6. Orders, Availability, and Expiration</h2>
        <p className="legal-page__text">
          An Order is a request, not a guarantee, until Verifio or its Provider accepts it and displays the relevant number or service status. We may decline, cancel, or modify an Order when a number is unavailable, a Provider rejects the request, a price or availability error occurs, abuse is suspected, or legal or operational requirements require it.
        </p>
        <p className="legal-page__text">
          You must use a number only during the period and for the purpose shown in the dashboard. Orders can expire automatically. A Code received after expiration, or a Code that is not accepted by the target platform, may not be recoverable. You are responsible for checking the displayed timer, status, country, service, and number before using them.
        </p>

        <h2 className="legal-page__heading">7. Pricing, Payments, and Taxes</h2>
        <p className="legal-page__text">
          Prices and fees are shown in the Service or at checkout and may vary by country, platform, number type, plan, Provider cost, taxes, and currency. We may change prices prospectively. A price change will not affect an Order already accepted unless required to correct an obvious error or address a Provider adjustment disclosed to you.
        </p>
        <ul className="legal-page__list">
          <li>You authorize us and our payment providers to charge the selected payment method for accepted Orders, Rentals, applicable taxes, and other amounts you authorize.</li>
          <li>Your account balance is a service credit or prepaid balance, not a bank account, deposit account, security, or transferable monetary instrument.</li>
          <li>Payment providers may apply their own processing fees, exchange rates, verification requirements, limits, and terms.</li>
          <li>Cryptocurrency transactions may be irreversible, subject to network confirmation, and affected by exchange rates, network fees, delays, or incorrect wallet details.</li>
          <li>You are responsible for taxes, duties, reporting, and payment obligations associated with your use of the Service, except taxes imposed on Verifio&apos;s net income.</li>
          <li>You may not use a payment method without authorization or initiate a fraudulent or abusive chargeback. We may suspend access while a payment dispute is investigated.</li>
        </ul>

        <h2 className="legal-page__heading">8. Refunds and Credits</h2>
        <p className="legal-page__text">
          Refunds, credits, and cancellations are handled according to the policy displayed at the time of purchase, the Order status, Provider rules, and applicable law. Unless required by law or expressly stated at checkout, completed verification services, used numbers, expired Orders, delivered Codes, and consumed Rentals are not refundable.
        </p>
        <p className="legal-page__text">
          Where a refund or credit is approved, we may return it to the original payment method, issue account credit, or use another reasonable method permitted by the payment provider. Processing times depend on the payment method and Provider. We may deny a refund where an Order was used for prohibited activity, a payment is disputed or reversed, the request is abusive, or the claimed failure resulted from the target platform, carrier, device, network, or information supplied by you.
        </p>

        <h2 className="legal-page__heading">9. Third-Party Platforms and Providers</h2>
        <p className="legal-page__text">
          The Service relies on independent Providers and may interact with third-party platforms such as Google, WhatsApp, Telegram, Facebook, Instagram, Discord, Microsoft, Apple, Amazon, Tinder, Snapchat, and others. Verifio does not control those platforms or Providers and does not guarantee their availability, acceptance of a number, delivery, policies, security, or decisions.
        </p>
        <p className="legal-page__text">
          Verifio is independent and is not affiliated with, endorsed by, or sponsored by any listed platform. All third-party names and trademarks belong to their respective owners. Your use of a third-party platform is governed by that platform&apos;s terms, privacy notice, and applicable rules.
        </p>

        <h2 className="legal-page__heading">10. Intellectual Property</h2>
        <p className="legal-page__text">
          The Service, including its software, design, branding, text, graphics, interfaces, documentation, and underlying technology, is owned by Verifio or its licensors and is protected by intellectual-property and other laws. Subject to these Terms, we grant you a limited, revocable, non-exclusive, non-transferable, non-sublicensable right to access and use the Service for your own lawful internal purposes.
        </p>
        <p className="legal-page__text">
          Except as expressly permitted by law or these Terms, you may not copy, modify, distribute, sell, lease, sublicense, create derivative works from, publicly display, or exploit any part of the Service. The Verifio name, logos, and marks may not be used without our prior written permission.
        </p>

        <h2 className="legal-page__heading">11. User Content and Feedback</h2>
        <p className="legal-page__text">
          You retain ownership of Content you lawfully submit to the Service. You grant Verifio a limited license to host, store, reproduce, process, and display that Content only as reasonably necessary to operate, secure, support, and improve the Service, comply with law, and enforce these Terms. You represent that you have the rights needed to submit the Content and that doing so does not violate law or another person&apos;s rights.
        </p>
        <p className="legal-page__text">
          If you send suggestions, ideas, or feedback, you grant Verifio a perpetual, worldwide, royalty-free right to use and incorporate that feedback without compensation or attribution. We are not required to keep, return, or publish feedback.
        </p>

        <h2 className="legal-page__heading">12. Privacy</h2>
        <p className="legal-page__text">
          Our collection and use of personal information is described in our <Link href="/privacy">Privacy Policy</Link>. You acknowledge that using the Service may involve processing account, order, phone-number, Code, payment, device, security, and support information by Verifio and its Providers as described there.
        </p>

        <h2 className="legal-page__heading">13. Service Changes, Maintenance, and Suspension</h2>
        <p className="legal-page__text">
          We may add, change, restrict, suspend, or discontinue any part of the Service, including supported platforms, countries, Providers, number types, limits, pricing, or features. We may perform maintenance or release updates that temporarily affect availability. We are not responsible for delay or failure caused by Providers, carriers, internet services, hosting, payment networks, platform decisions, force majeure events, or other circumstances outside our reasonable control.
        </p>
        <p className="legal-page__text">
          We may suspend or limit your Account or an Order immediately when reasonably necessary to prevent harm, investigate suspected abuse, comply with law, protect users or Providers, address a security incident, or resolve a payment issue. We may provide notice when practical, but advance notice is not guaranteed in urgent situations.
        </p>

        <h2 className="legal-page__heading">14. Disclaimers</h2>
        <p className="legal-page__text">
          TO THE MAXIMUM EXTENT PERMITTED BY LAW, THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE.&quot; VERIFIO DISCLAIMS ALL WARRANTIES, WHETHER EXPRESS, IMPLIED, OR STATUTORY, INCLUDING WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, NON-INFRINGEMENT, QUIET ENJOYMENT, AND ACCURACY.
        </p>
        <p className="legal-page__text">
          WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, SECURE, ERROR-FREE, AVAILABLE IN A PARTICULAR COUNTRY, COMPATIBLE WITH A PARTICULAR PLATFORM, OR CAPABLE OF DELIVERING A CODE WITHIN A PARTICULAR TIME. WE DO NOT WARRANT THAT A NUMBER WILL BE ACCEPTED BY A TARGET PLATFORM, THAT A PLATFORM WILL ALLOW AN ACCOUNT OR ACTION, OR THAT THE SERVICE WILL MEET YOUR PARTICULAR REQUIREMENTS.
        </p>

        <h2 className="legal-page__heading">15. Limitation of Liability</h2>
        <p className="legal-page__text">
          TO THE MAXIMUM EXTENT PERMITTED BY LAW, VERIFIO AND ITS OWNERS, OFFICERS, EMPLOYEES, CONTRACTORS, LICENSORS, AND PROVIDERS WILL NOT BE LIABLE FOR INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, EXEMPLARY, OR PUNITIVE DAMAGES, OR FOR LOSS OF PROFITS, REVENUE, BUSINESS, GOODWILL, OPPORTUNITY, DATA, ACCOUNT ACCESS, OR EXPECTED SAVINGS, ARISING FROM OR RELATED TO THE SERVICE OR THESE TERMS.
        </p>
        <p className="legal-page__text">
          TO THE MAXIMUM EXTENT PERMITTED BY LAW, VERIFIO&apos;S TOTAL LIABILITY FOR ALL CLAIMS ARISING FROM OR RELATED TO THE SERVICE OR THESE TERMS WILL NOT EXCEED THE GREATER OF THE AMOUNT YOU PAID TO VERIFIO FOR THE SPECIFIC SERVICE GIVING RISE TO THE CLAIM DURING THE THREE MONTHS BEFORE THE EVENT OR ONE HUNDRED U.S. DOLLARS (US$100). THESE LIMITATIONS APPLY REGARDLESS OF THE LEGAL THEORY AND EVEN IF A REMEDY FAILS OF ITS ESSENTIAL PURPOSE.
        </p>

        <h2 className="legal-page__heading">16. Indemnification</h2>
        <p className="legal-page__text">
          To the maximum extent permitted by law, you agree to defend, indemnify, and hold harmless Verifio and its owners, officers, employees, contractors, licensors, and Providers from claims, liabilities, damages, losses, costs, and expenses, including reasonable legal fees, arising out of or related to your Content, your Account, your breach of these Terms, your violation of law or third-party rights, or your misuse of the Service. We reserve the right to assume exclusive control of the defense of a matter subject to indemnification, and you agree to cooperate with that defense.
        </p>

        <h2 className="legal-page__heading">17. Termination</h2>
        <p className="legal-page__text">
          You may stop using the Service at any time and may request Account closure through the <Link href="/contact">Contact Us</Link> page. We may terminate or suspend these Terms, your Account, or access to all or part of the Service at any time where permitted by law, including for breach, fraud, abuse, payment reversals, security concerns, legal requirements, or operational reasons.
        </p>
        <p className="legal-page__text">
          On termination, your right to use the Service ends immediately. You remain responsible for amounts incurred before termination. Provisions that by their nature should survive termination will survive, including provisions concerning intellectual property, Content licenses, disclaimers, liability limits, indemnification, dispute resolution, and general terms. We may retain information as described in the Privacy Policy or as required by law.
        </p>

        <h2 className="legal-page__heading">18. Dispute Resolution and Governing Law</h2>
        <p className="legal-page__text">
          Before starting a formal dispute, you agree to contact us through the <Link href="/contact">Contact Us</Link> page and give us a reasonable opportunity to investigate and resolve the issue. If we cannot resolve it informally, the dispute will be governed by the laws and resolved in the courts or other forum specified by the Verifio operating entity in the jurisdiction where it is established, without regard to conflict-of-law principles, except where mandatory consumer law provides otherwise.
        </p>
        <p className="legal-page__text">
          Nothing in this section prevents either party from seeking urgent injunctive or equitable relief, pursuing a legally available small-claims action, reporting unlawful conduct to a government authority, or exercising a non-waivable right under applicable law. Any arbitration, class-action waiver, or mandatory pre-suit procedure will apply only if it is separately presented and legally enforceable in your jurisdiction.
        </p>

        <h2 className="legal-page__heading">19. Changes to These Terms</h2>
        <p className="legal-page__text">
          We may update these Terms to reflect changes to the Service, Providers, business practices, or law. We will post the revised Terms and update the &quot;Last updated&quot; date. For material changes, we may provide additional notice where appropriate. Changes apply from the stated effective date. If you continue using the Service after that date, you agree to the revised Terms, subject to applicable law.
        </p>

        <h2 className="legal-page__heading">20. General Terms</h2>
        <ul className="legal-page__list">
          <li><strong>Entire agreement:</strong> these Terms, the Privacy Policy, and any order-specific terms displayed to you are the entire agreement about the Service.</li>
          <li><strong>Severability:</strong> if a provision is unenforceable, it will be modified to the minimum extent necessary, and the remaining provisions will remain effective.</li>
          <li><strong>No waiver:</strong> our failure to enforce a provision is not a waiver of our right to enforce it later.</li>
          <li><strong>Assignment:</strong> you may not assign or transfer these Terms without our written consent. We may assign them in connection with a merger, acquisition, reorganization, or sale of assets.</li>
          <li><strong>Relationship:</strong> these Terms do not create a partnership, agency, employment, fiduciary, or joint-venture relationship between you and Verifio.</li>
          <li><strong>Notices:</strong> we may provide notices through the Service, by email, or by posting them on the website. You may contact us through the <Link href="/contact">Contact Us</Link> page.</li>
          <li><strong>Force majeure:</strong> neither party is liable for delay or failure caused by events beyond reasonable control, including outages, natural disasters, war, civil unrest, labor disputes, government action, or failures of networks and Providers.</li>
        </ul>

        <h2 className="legal-page__heading">21. Contact Us</h2>
        <p className="legal-page__text">
          If you have questions about these Terms, an Order, a payment, or an account restriction, please visit our <Link href="/contact">Contact Us</Link> page. Do not include passwords, private keys, full payment credentials, or verification Codes unless we specifically request them through a secure process.
        </p>
      </article>
    </div>
  );
}
