/**
 * Structured Data (JSON-LD) for SEO
 * This helps Google show rich results like sitelinks, knowledge panels, etc.
 * Also helps LLMs understand the product and company.
 */

export function OrganizationSchema() {
  const organizationData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": "https://www.reimburseai.app/#organization",
    name: "Reimburse AI",
    alternateName: ["ReimburseAI", "Reimburse.AI"],
    url: "https://www.reimburseai.app",
    logo: {
      "@type": "ImageObject",
      url: "https://www.reimburseai.app/logo.png",
      width: 512,
      height: 512,
    },
    image: "https://www.reimburseai.app/og-image.png",
    description:
      "Reimburse AI is an AI-powered expense management platform that automates receipt auditing with GPT-4o vision and enables instant USDC crypto payments on Avalanche blockchain.",
    foundingDate: "2024",
    // TODO: Add founders when ready
    // founders: [
    //   {
    //     "@type": "Person",
    //     name: "Founder Name",
    //     jobTitle: "CEO & Co-Founder",
    //   },
    // ],
    // Add your actual social profiles when created
    sameAs: [
      "https://twitter.com/reimburseai",
      "https://linkedin.com/company/reimburseai",
      "https://github.com/reimburseai",
    ],
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer support",
      email: "support@reimburseai.app",
      availableLanguage: ["English"],
    },
    address: {
      "@type": "PostalAddress",
      addressCountry: "US",
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationData) }}
    />
  );
}

export function WebsiteSchema() {
  const websiteData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": "https://www.reimburseai.app/#website",
    url: "https://www.reimburseai.app",
    name: "Reimburse AI",
    description:
      "AI-powered expense management with instant crypto settlements",
    publisher: {
      "@id": "https://www.reimburseai.app/#organization",
    },
    // This enables the sitelinks search box in Google
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: "https://www.reimburseai.app/search?q={search_term_string}",
      },
      "query-input": "required name=search_term_string",
    },
    inLanguage: "en-US",
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteData) }}
    />
  );
}

export function SoftwareApplicationSchema() {
  const softwareData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "@id": "https://www.reimburseai.app/#software",
    name: "Reimburse AI",
    applicationCategory: "BusinessApplication",
    applicationSubCategory: "Expense Management Software",
    operatingSystem: "Web Browser",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      description: "Free to start, pay $0.50 per AI audit",
    },
    // TODO: Add aggregateRating after collecting real reviews
    // aggregateRating: {
    //   "@type": "AggregateRating",
    //   ratingValue: "4.9",
    //   ratingCount: "50",
    // },
    featureList: [
      "AI-powered receipt scanning with GPT-4o vision",
      "Instant USDC cryptocurrency payments",
      "Automated expense categorization",
      "Multi-company support",
      "Blockchain-verified audit trail",
      "x402 protocol micropayments",
      "Real-time reimbursement tracking",
      "Avalanche blockchain integration",
    ],
    screenshot: "https://www.reimburseai.app/og-image.png",
    softwareVersion: "1.0",
    releaseNotes: "Initial release with AI auditing and crypto payments",
    author: {
      "@id": "https://www.reimburseai.app/#organization",
    },
    provider: {
      "@id": "https://www.reimburseai.app/#organization",
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareData) }}
    />
  );
}

export function BreadcrumbSchema({ items }: { items: { name: string; url: string }[] }) {
  const breadcrumbData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbData) }}
    />
  );
}

export function FAQSchema({ faqs }: { faqs: { question: string; answer: string }[] }) {
  const faqData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(faqData) }}
    />
  );
}

// Combined component for homepage
export function HomepageStructuredData() {
  return (
    <>
      <OrganizationSchema />
      <WebsiteSchema />
      <SoftwareApplicationSchema />
    </>
  );
}
