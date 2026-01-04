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
    founders: [
      {
        "@type": "Person",
        name: "Shunsuke Mark Nakatani",
        jobTitle: "Co-Founder & CEO",
        description: "Japan-born entrepreneur at the University of Washington and Vice President of the UW Blockchain Society, building innovative solutions at the intersection of Web3 and AI.",
        sameAs: [
          "https://x.com/Mark_Nakatani",
          "https://www.linkedin.com/in/shunsuke-nakatani-770176373/",
        ],
      },
      {
        "@type": "Person",
        name: "Suyash Kumar Singh",
        jobTitle: "Co-Founder & CTO",
        description: "IIT Guwahati student and passionate builder specializing in AI, Web3, and Blockchain solutions that solve real-world problems.",
        sameAs: [
          "https://x.com/blinderchief_",
          "https://www.linkedin.com/in/suyash-kumar-singh/",
        ],
      },
    ],
    sameAs: [
      "https://x.com/reimburseai",
      "https://www.linkedin.com/company/reimburse-ai",
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

// About page structured data with team information
export function AboutPageStructuredData() {
  const aboutPageData = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    "@id": "https://www.reimburseai.app/about",
    name: "About Reimburse AI",
    description: "Learn about Reimburse AI's mission to revolutionize expense management with AI and blockchain technology.",
    url: "https://www.reimburseai.app/about",
    mainEntity: {
      "@id": "https://www.reimburseai.app/#organization",
    },
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: "https://www.reimburseai.app",
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "About",
          item: "https://www.reimburseai.app/about",
        },
      ],
    },
  };

  // Team member schema for rich results
  const teamSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Reimburse AI Team",
    description: "The founding team behind Reimburse AI",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        item: {
          "@type": "Person",
          name: "Shunsuke Mark Nakatani",
          jobTitle: "Co-Founder & CEO",
          description: "Japan-born entrepreneur at the University of Washington and Vice President of the UW Blockchain Society, driving innovation at the intersection of Web3 and AI.",
          worksFor: {
            "@id": "https://www.reimburseai.app/#organization",
          },
          alumniOf: {
            "@type": "CollegeOrUniversity",
            name: "University of Washington",
          },
          sameAs: [
            "https://x.com/Mark_Nakatani",
            "https://www.linkedin.com/in/shunsuke-nakatani-770176373/",
          ],
        },
      },
      {
        "@type": "ListItem",
        position: 2,
        item: {
          "@type": "Person",
          name: "Suyash Kumar Singh",
          jobTitle: "Co-Founder & CTO",
          description: "IIT Guwahati student and passionate builder specializing in AI, Web3, and Blockchain solutions.",
          worksFor: {
            "@id": "https://www.reimburseai.app/#organization",
          },
          alumniOf: {
            "@type": "CollegeOrUniversity",
            name: "Indian Institute of Technology Guwahati",
          },
          sameAs: [
            "https://x.com/blinderchief_",
            "https://www.linkedin.com/in/suyash-kumar-singh/",
          ],
        },
      },
      {
        "@type": "ListItem",
        position: 3,
        item: {
          "@type": "Person",
          name: "Juan Felipe Gaviria Giraldo",
          jobTitle: "Team Member",
          description: "Systems Engineer and International Business professional from Colombia, specializing in AI and Blockchain.",
          worksFor: {
            "@id": "https://www.reimburseai.app/#organization",
          },
          sameAs: [
            "https://x.com/JuanFeG07",
            "https://www.linkedin.com/in/juan-felipe-gaviria-giraldo-4ab54224a",
          ],
        },
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(aboutPageData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(teamSchema) }}
      />
      <OrganizationSchema />
    </>
  );
}
