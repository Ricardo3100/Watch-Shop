import Link from "next/link";
import { AiOutlineArrowLeft, AiOutlineArrowRight } from "react-icons/ai";

export default function PrivacyPolicyPage() {
  return (
    <>
      <div className="flex justify-between items-center mb-8">
        <Link href="/admin/dashboard" className="flex items-center gap-2">
          <AiOutlineArrowLeft />
          Back to Dashboard
        </Link>
      </div>
      <div className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-4xl font-bold text-center mb-2">Watch Shop</h1>
        <h2 className="text-2xl font-semibold text-center mb-2">
          Privacy Policy
        </h2>
        <p className="text-center text-gray-500 italic mb-1">
          Effective Date: March 8, 2026
        </p>
        <p className="text-center text-gray-500 italic mb-10">
          Portfolio Demonstration Project
        </p>

        <hr className="mb-10" />

        <section className="mb-10">
          <h2 className="text-xl font-bold mb-4">1. Overview</h2>
          <p className="text-gray-700 mb-4">
            Watch Shop is a portfolio demonstration project built to learn how
            to implement automated accessibility auditing in a CI/CD pipeline.
            The ecommerce context was chosen deliberately — it provides a
            realistic, feature-rich environment to test against WCAG standards.
            It is not a commercial operation. No products are physically sold or
            shipped.
          </p>
          <p className="text-gray-700">
            This privacy policy explains exactly what personal information is
            collected when you interact with this demo, how it is protected, and
            how it is deleted. Transparency is a core design principle of this
            project.
          </p>
        </section>

        <hr className="mb-10" />

        <section className="mb-10">
          <h2 className="text-xl font-bold mb-4">
            2. What Information We Collect
          </h2>

          <h3 className="text-lg font-semibold mb-2">
            When You Place a Demo Order
          </h3>
          <p className="text-gray-700 mb-3">
            To complete a test transaction, Stripe collects the following
            information on our behalf:
          </p>
          <ul className="list-disc list-inside text-gray-700 mb-4 space-y-1">
            <li>Full name</li>
            <li>Email address</li>
            <li>
              Shipping address (street, city, state, postal code, country)
            </li>
            <li>
              Payment card details — handled entirely by Stripe, never seen or
              stored by this application
            </li>
          </ul>
          <p className="text-gray-700 mb-6">
            The name, email address, and shipping address are passed to this
            application via a Stripe webhook after payment is confirmed.
          </p>

          <h3 className="text-lg font-semibold mb-2">
            When You Visit the Shop
          </h3>
          <p className="text-gray-700">
            Standard server logs may record your IP address and browser
            information. This data is not stored in our database and is not used
            for tracking or marketing.
          </p>
        </section>

        <hr className="mb-10" />

        <section className="mb-10">
          <h2 className="text-xl font-bold mb-4">
            3. How Your Information Is Protected
          </h2>

          <h3 className="text-lg font-semibold mb-2">
            Encryption at Rest — AES-256-GCM
          </h3>
          <p className="text-gray-700 mb-3">
            Your personal information is never stored in plain text. Before
            being saved to the database, the following fields are encrypted
            using AES-256-GCM — the same encryption standard used by banks and
            governments:
          </p>
          <ul className="list-disc list-inside text-gray-700 mb-4 space-y-1">
            <li>Email address</li>
            <li>Full name</li>
            <li>Shipping address</li>
          </ul>
          <p className="text-gray-700 mb-4">
            AES-256-GCM generates a unique initialisation vector for every
            encryption operation. This means that even if two customers share
            the same email address, the encrypted values stored in the database
            are different. The encryption key is stored separately from the
            database in environment variables and is never committed to source
            control.
          </p>
          <p className="text-gray-700 mb-6">
            Even if the database were to be breached, your personal information
            would be unreadable without the encryption key.
          </p>

          <h3 className="text-lg font-semibold mb-2">Payment Security</h3>
          <p className="text-gray-700 mb-6">
            This application never sees, processes, or stores your payment card
            information. All card handling is performed directly by Stripe, a
            PCI-DSS Level 1 certified payment processor. Card data goes from
            your browser directly to Stripe — it never passes through our
            servers.
          </p>

          <h3 className="text-lg font-semibold mb-2">Admin Access</h3>
          <p className="text-gray-700">
            The admin dashboard is protected by WebAuthn passkey authentication.
            No passwords are stored anywhere in the system. Admin credentials
            use public-key cryptography — only the public key is stored in the
            database. The corresponding private key never leaves the
            administrator's device.
          </p>
        </section>

        <hr className="mb-10" />

        <section className="mb-10">
          <h2 className="text-xl font-bold mb-4">4. Automatic Data Deletion</h2>
          <p className="text-gray-700 mb-6">
            This is the most important section of this privacy policy. Unlike
            most services, this project is designed to delete your personal
            information automatically and permanently.
          </p>

          <h3 className="text-lg font-semibold mb-2">The 24-Hour Rule</h3>
          <p className="text-gray-700 mb-3">
            All personal information associated with your order is scheduled for
            permanent deletion within 24 hours of your order being placed. There
            are two deletion paths:
          </p>
          <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
            <li>
              <span className="font-medium">Manual path</span> — If the admin
              processes your order within 24 hours, your personal information is
              deleted from the database immediately after your shipping
              confirmation email is sent.
            </li>
            <li>
              <span className="font-medium">Automatic path</span> — If the admin
              does not process your order within 24 hours, a scheduled job
              (Vercel Cron) runs automatically, sends you a demo completion
              email, and permanently deletes your personal information and full
              order record from the database.
            </li>
          </ul>
          <p className="text-gray-700 mb-3">
            After deletion, the following information is permanently gone from
            our systems:
          </p>
          <ul className="list-disc list-inside text-gray-700 mb-4 space-y-1">
            <li>Your email address</li>
            <li>Your name</li>
            <li>Your shipping address</li>
            <li>Your full order record</li>
          </ul>
          <p className="text-gray-700 mb-6 font-medium">
            We do not store your data. We do not archive it. We do not back it
            up in secondary systems. Deletion is permanent.
          </p>

          <h3 className="text-lg font-semibold mb-2">Deletion Confirmation</h3>
          <p className="text-gray-700">
            You will receive an email confirming that your personal information
            has been deleted. This email is sent either with your shipping
            confirmation (manual path) or as a standalone demo completion notice
            (automatic path). The email explicitly states that deletion is
            complete.
          </p>
        </section>

        <hr className="mb-10" />

        <section className="mb-10">
          <h2 className="text-xl font-bold mb-4">5. Third-Party Services</h2>
          <p className="text-gray-700 mb-6">
            This project uses the following third-party services to operate.
            Each has its own privacy policy.
          </p>

          <h3 className="text-lg font-semibold mb-2">
            Stripe — Payment Processing
          </h3>
          <p className="text-gray-700 mb-6">
            Stripe processes all payment card transactions. When you enter your
            card details, that information goes directly to Stripe and is
            governed by Stripe's privacy policy. We receive only a payment
            confirmation and your shipping details from Stripe after a
            successful payment.
          </p>

          <h3 className="text-lg font-semibold mb-2">
            MongoDB Atlas — Database Hosting
          </h3>
          <p className="text-gray-700 mb-6">
            Order data (encrypted) is stored in MongoDB Atlas, a cloud database
            service. Data is stored in the United States. MongoDB Atlas is
            governed by MongoDB's privacy policy.
          </p>

          <h3 className="text-lg font-semibold mb-2">
            Brevo — Transactional Email
          </h3>
          <p className="text-gray-700 mb-6">
            Order confirmation emails, shipping notification emails, and demo
            completion emails are sent via Brevo (formerly Sendinblue). Your
            email address is passed to Brevo solely for the purpose of sending
            these transactional emails. Brevo does not use your email address
            for marketing purposes on our behalf.
          </p>

          <h3 className="text-lg font-semibold mb-2">FedEx — Shipping API</h3>
          <p className="text-gray-700 mb-6">
            This project integrates with the FedEx sandbox API to generate demo
            tracking numbers. In this demonstration environment, your shipping
            address is sent to FedEx's sandbox (test) environment to generate a
            tracking number. No physical shipment is created.
          </p>

          <h3 className="text-lg font-semibold mb-2">Vercel — Hosting</h3>
          <p className="text-gray-700">
            This application is hosted on Vercel. Vercel may collect standard
            server log data including IP addresses and request headers as part
            of normal hosting operations. This is governed by Vercel's privacy
            policy.
          </p>
        </section>

        <hr className="mb-10" />

        <section className="mb-10">
          <h2 className="text-xl font-bold mb-4">6. What We Do Not Do</h2>
          <ul className="list-disc list-inside text-gray-700 space-y-2">
            <li>
              We do not sell your personal information to any third party.
            </li>
            <li>
              We do not use your personal information for marketing or
              advertising.
            </li>
            <li>We do not display advertising in this application.</li>
            <li>
              We do not share your personal information with any party other
              than those listed in Section 5.
            </li>
            <li>
              We do not retain your personal information beyond the 24-hour
              window described in Section 4.
            </li>
            <li>We do not store payment card information — ever.</li>
          </ul>
        </section>

        <hr className="mb-10" />

        <section className="mb-10">
          <h2 className="text-xl font-bold mb-4">7. Children's Privacy</h2>
          <p className="text-gray-700">
            This project is not directed at children under the age of 13. We do
            not knowingly collect personal information from children under 13.
            If you believe a child under 13 has submitted personal information
            through this demo, please contact us so we can delete it
            immediately.
          </p>
        </section>

        <hr className="mb-10" />

        <section className="mb-10">
          <h2 className="text-xl font-bold mb-4">8. Your Rights</h2>
          <p className="text-gray-700 mb-3">
            Because this project deletes all personal information automatically
            within 24 hours, most data rights are satisfied by design. However,
            you may also request:
          </p>
          <ul className="list-disc list-inside text-gray-700 mb-4 space-y-1">
            <li>
              Immediate deletion of your personal information before the 24-hour
              window expires.
            </li>
            <li>
              Confirmation that your personal information has been deleted.
            </li>
            <li>Information about what data is currently held about you.</li>
          </ul>
          <p className="text-gray-700">
            To make any of these requests, contact the project owner directly.
            Because data is deleted within 24 hours regardless, requests are
            typically resolved within that window automatically.
          </p>
        </section>

        <hr className="mb-10" />

        <section className="mb-10">
          <h2 className="text-xl font-bold mb-4">9. Changes to This Policy</h2>
          <p className="text-gray-700">
            This privacy policy may be updated as the project evolves. The
            effective date at the top of this document will always reflect the
            most recent version. Because this is a portfolio project and not a
            commercial service, we are not obligated to notify individual users
            of changes — however we will update the date when material changes
            are made.
          </p>
        </section>

        <hr className="mb-10" />

        <section className="mb-10">
          <h2 className="text-xl font-bold mb-4">10. Contact</h2>
          <p className="text-gray-700">
            This is a portfolio demonstration project. If you have questions
            about this privacy policy or about how your data is handled, please
            contact the project owner through the contact information provided
            in the project repository.
          </p>
        </section>

        <hr className="mb-8" />

        <footer className="text-center text-gray-400 text-sm italic space-y-1">
          <p>
            Watch Shop — Portfolio Demonstration Project — Not a commercial
            service
          </p>
          <p>Designed and developed by Ricardo Rodriguez all rights reserved</p>
        </footer>
      </div>
    </>
  );
}