import { AcademyLesson } from '../types';

export const lessons: AcademyLesson[] = [
  {
    id: 'shopify-architecture',
    title: '1. Shopify Architecture: Liquid vs Headless (Hydrogen)',
    category: 'architecture',
    shortDesc: 'Understand the framework options: standard themes with Liquid templating or full React-based Headless storefronts with Hydrogen and Remix.',
    fullMarkdown: `### The Frontend Paradigm: Monolithic vs Headless

A Shopify website can be built in two fundamental ways:
1. **The Classic Monolithic Theme (Liquid)**: Shopify's standard servers-side template engine. It compiles HTML on Shopify's servers and serves it statically to clients. Excellent for rapid deployment.
2. **Headless Architecture (Hydrogen & Remix)**: A modern, decoupled architecture. You build a custom React application hosted on dynamic container edge hosts (like Shopify Oxygen) and fetch content using the ultra-fast, GraphQL-based **Shopify Storefront API**.

---

### Key Technical Tradeoffs

| Feature | Monolithic Liquid Themes | Headless (Hydrogen / React) |
| :--- | :--- | :--- |
| **Development Speed** | Immediate (No-code / Low-code customizer) | Moderate (Requires complete React/Remix build) |
| **Performance (Lighthouse)** | Good (Influenced by heavy app-embed scripts) | Outstanding (Optimized React hydrate, Edge cached) |
| **UX Freedom** | Bound by Theme Editor customizer limits | Limitless. Absolute control of typography, layout, animations |
| **Multi-channel integration** | Direct | Connected via unified GraphQL fetch client |

---

### How Shopify Manages Content
Regardless of the frontend, Shopify acts as a **SaaS back-office**. The **Shopify Admin Dashboard** secures:
- **Product Information Management (PIM)**: Single source of truth for descriptions, dimensions, weights, and high-res image CDN.
- **Inventory Engine**: Real-time stock counting across multiple locations/retail stores.
- **Customer Directory & Groups**: Segments for wholesales, VIPs, or geographical regions.
`,
    codeSnippet: {
      language: 'liquid',
      filename: 'product-card.liquid',
      code: `{% comment %}
  Standard Shopify Liquid template for rendering a watch product card.
{% endcomment %}

<div class="product-card border border-neutral-200 p-4 rounded-lg">
  <img 
    src="{{ product.featured_image | img_url: '400x400', crop: 'center' }}" 
    alt="{{ product.title | escape }}" 
    class="w-full h-auto object-cover rounded-md"
    loading="lazy"
  />
  
  <div class="mt-3">
    <span class="text-xs uppercase font-mono text-neutral-400">{{ product.vendor }}</span>
    <h3 class="font-sans text-lg font-medium text-neutral-900 mt-1">
      <a href="{{ product.url }}">{{ product.title }}</a>
    </h3>
    
    <div class="mt-2 flex justify-between items-center">
      <span class="text-indigo-600 font-medium">
        {% if product.price_varies %}
          From {{ product.price_min | money }}
        {% else %}
          {{ product.price | money }}
        {% endif %}
      </span>
      
      {% if product.available %}
        <span class="text-green-600 text-xs font-mono">• In Stock</span>
      {% else %}
        <span class="text-red-500 text-xs font-mono">• Sold Out</span>
      {% endif %}
    </div>
  </div>
</div>`
    }
  },
  {
    id: 'catalog-metafields',
    title: '2. Catalog & Data Modeling: SKUs and Metafields',
    category: 'catalog',
    shortDesc: 'Learn how to structure e-commerce catalog schemas, map complex watch variants, and extend the default Shopify data model using Metafields.',
    fullMarkdown: `### Designing a Premium Watch Schema

To represent high-end watches, the default database model (Product Title, Description, Variants) is rarely sufficient. Watches require sophisticated technical specifications (water resistance, movement calibre, bezel profile) to establish buyer confidence.

In Shopify, you extend standard schemas using **Metafields & Metaobjects**:
- **Metafields**: Custom key-value pairs assigned directly to specific entries (Products, Variants, Customers).
- **Metaobjects**: Custom data-tables that let you build shared entities (e.g., a "Watch Movement" object containing calibration specs) and link them across multiple watch SKUs.

---

### Best Practices for Product Organization
1. **Handle Multi-Variant Integrity**: Group variations (e.g., different strap materials or dial combinations) within the same parent product ID. Ensure each variant possesses a unique, human-scannable SKU (e.g., \`CHRONO-OCEAN-STEE-42\`).
2. **Optimize Image Assets**: Serve compressed format configurations (WebP/AVIF) from Shopify's content delivery networks with specific crop widths dynamically requested via query parameters (e.g., \`?width=600\`).
3. **Structured Taxonomy**: Categorize items using standardized Shopify product categories to ensure correct automated taxation and integration with Google Shopping networks.
`,
    codeSnippet: {
      language: 'json',
      filename: 'shopify-metafields.json',
      code: `{
  "product": {
    "title": "Ocean Chronograph Active",
    "handle": "ocean-chronograph-active",
    "variants": [
      {
        "sku": "CHRONO-OCEAN-STEE-42",
        "price": "2450.00",
        "inventory_quantity": 18,
        "option1": "Stainless Steel Band"
      }
    ],
    "metafields": [
      {
        "namespace": "technical_specs",
        "key": "movement_type",
        "value": "Automatic Calibre SC-300",
        "type": "single_line_text_field"
      },
      {
        "namespace": "technical_specs",
        "key": "water_resistance",
        "value": "300 meters / 1000 feet",
        "type": "single_line_text_field"
      },
      {
        "namespace": "technical_specs",
        "key": "crystal_material",
        "value": "Double-domed sapphire with anti-reflective coating",
        "type": "single_line_text_field"
      }
    ]
  }
}`
    }
  },
  {
    id: 'payment-gateways',
    title: '3. Payments & Secure Checkout Pipeline',
    category: 'payments',
    shortDesc: 'Explore how e-commerce payment gateways work, including PCI-DSS compliance, third-party sandboxes, and secure tokenization of cards.',
    fullMarkdown: `### The Lifecycle of a Secure Checkout Transaction

An online checkout must be exceptionally rapid and strictly PCI-DSS compliant. Customer credit details are never stored or seen by the storefront backend.

Instead, payment tokenization coordinates the flow:
1. **Tokenizer Form**: Shopify or Stripe hosts secure client-side iframe elements directly inside the form markup fields (such as Stripe Elements or Shopify Hosted Fields).
2. **Credit Card Tokenization**: When the shopper submits their card details, the secure iframe intercepts the touch-event and posts the credit card credentials straight to the secure vault backend.
3. **Token Dispatch**: The terminal sends back an opaque, temporary single-use token representing the credit instrument (e.g., \`tok_1N89C2L0\`), which can safely pass through the public network.
4. **Approve & Charge**: The merchant storefront passes this token, plus total amount and currency, to the background transaction engine API which completes the balance transfer recursively.

---

### Understanding Gateway Integrations

Shopify secures pre-built integrations with top engines:
- **Shopify Payments**: Powered back-to-back by Stripe, deeply optimizing conversion via built-in Shop Pay wallets.
- **Paypal Express Checkout**: Redirect flow tokenizing accounts externally.
- **Apple Pay & Google Pay**: Local biometrically secured hardware-token integrations.
- **Buy Now, Pay Later (BNPL)**: Integrates with systems like Affirm, Klarna, or Afterpay.
`,
    codeSnippet: {
      language: 'typescript',
      filename: 'stripe-charge.ts',
      code: `import Stripe from 'stripe';

// Initialize the Stripe client lazily with environment variables
let stripeClient: Stripe | null = null;

function getStripeInstance(): Stripe {
  if (!stripeClient) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error('STRIPE_SECRET_KEY is missing. Check your credentials settings.');
    }
    stripeClient = new Stripe(key, { apiVersion: '2023-10-16' });
  }
  return stripeClient;
}

export async function processPayment(token: string, amountCents: number, currency: string = 'usd') {
  try {
    const stripe = getStripeInstance();
    const charge = await stripe.charges.create({
      amount: amountCents,
      currency: currency,
      source: token,
      description: 'Charge for Luxury Watch Store Order',
    });
    return {
      status: 'success',
      chargeId: charge.id,
      receiptUrl: charge.receipt_url
    };
  } catch (error: any) {
    console.error('Payment Processing Failed:', error.message);
    throw new Error(\`Transaction Declined: \${error.message}\`);
  }
}`
    }
  },
  {
    id: 'logistics-webhooks',
    title: '4. Webhooks & Automated Fulfillment Logistics',
    category: 'logistics',
    shortDesc: 'Sync physical stock and automate warehouses using Shopify Webhooks to feed fulfillment APIs on order completion.',
    fullMarkdown: `### Integrating the Logistics Engine

Once a user places an order, the virtual e-commerce store needs to connect with real-world physical warehouses. This is managed asynchronously using **Shopify Webhooks**.

A Webhook is an HTTP POST notification dispatched from Shopify to a registered subscription URL (like your custom server) when events occur (e.g., order created, tracking updated, stock depleted).

---

### Step-by-Step Fulfillment Automation

1. **The order is placed**: The secure shopping cart updates.
2. **Shopify fires a Webhook**: A secure webhook with event type \`orders/create\` is triggered. It carries a JSON payload outlining order details, SKUs, customer details, and shipping address.
3. **Your Server Validates Signature**: To prevent spoofing, your server must verify the \`X-Shopify-Hmac-SHA256\` signature header using the secret webhook key.
4. **Dispatched to 3PL (Third-Party Logistics)**: The validated order details are routed to a service like **ShipStation**, **Amazon MCF**, or **Flexport**.
5. **Tracking Synchronized**: When physical carriers (FedEx, UPS, DHL) scan the box, the warehouse updates tracking coordinates back, which triggers automated status emails.
`,
    codeSnippet: {
      language: 'typescript',
      filename: 'shopify-webhook.ts',
      code: `import express from 'express';
import crypto from 'crypto';

const app = express();
const SHOPIFY_SHARED_SECRET = process.env.SHOPIFY_WEBHOOK_SECRET || 'test-secret';

app.post('/api/webhooks/orders-create', express.raw({ type: 'application/json' }), (req, res) => {
  const hmacHeader = req.headers['x-shopify-hmac-sha256'] as string;
  const rawBody = req.body;

  // 1. Double check authenticity of incoming webhook
  const generatedHash = crypto
    .createHmac('sha256', SHOPIFY_SHARED_SECRET)
    .update(rawBody)
    .digest('base64');

  if (generatedHash !== hmacHeader) {
    console.error('⚠️ Unauthorized Webhook Signature Detected!');
    return res.status(401).send('HMAC Verification Failed');
  }

  // 2. Safely parse the verified JSON payload
  const orderData = JSON.parse(rawBody.toString());
  console.log(\`📦 Real-time Webhook: Order #\${orderData.order_number} Processed!\`);

  // 3. Initiate Third-Party Logistics (3PL) fulfillment API
  // Example: notifyWarehouseFulfillment(orderData.line_items, orderData.shipping_address);

  res.status(200).send('Webhook Received and Authenticated');
});`
    }
  },
  {
    id: 'marketing-seo',
    title: '5. Technical SEO: Structured Microdata & Sitemaps',
    category: 'marketing',
    shortDesc: 'Master search engine optimization for products using standardized schema.org structures and meta markup.',
    fullMarkdown: `### How Search Engines Index Luxury Goods

Google and other major crawl bots index e-commerce nodes using structured microdata. If a watch is listed, crawlers read JSON-LD (JavaScript Object Notation for Linked Data) injected in the document headers.

This JSON-LD precisely maps available reviews, exact pricing models, and stock ratios direct on search landing tables.

---

### Core Principles of SEO for Storefronts

1. **Rich Schema Integration**: Anchor Schema.org structured models targeting \`Product\`, \`Offer\`, and \`AggregateRating\` components in each product node.
2. **Canonical URL Uniformity**: Guard against search engines treating multiple routes representing filters (e.g., \`?color=blue&size=40mm\`) as duplicate articles. Set a single canonical self-linking tag:
   \`<link rel="canonical" href="https://yourstore.com/products/ocean-chronograph" />\`
3. **Optimized Robots & XML Maps**: Render custom sitemap paths (\`/sitemap.xml\`) updated dynamically as inventory tags shift, making listing discovery effortless.
`,
    codeSnippet: {
      language: 'html',
      filename: 'product-seo.html',
      code: `<!-- Standard Injected JSON-LD Microdata schema for SEO -->
<script type="application/ld+json">
{
  "@context": "https://schema.org/",
  "@type": "Product",
  "name": "Classic Gold Tourbillon",
  "image": [
    "https://yourstore.com/cdn/gold_tourbillon.png"
  ],
  "description": "Exquisite skeletonized tourbillon luxury wristwatch featuring a genuine brown alligator strap.",
  "sku": "WATCH-TOURB-GOLD-01",
  "mpn": "9120304",
  "brand": {
    "@type": "Brand",
    "name": "Prestige Horizon"
  },
  "offers": {
    "@type": "Offer",
    "url": "https://yourstore.com/products/gold-tourbillon",
    "priceCurrency": "USD",
    "price": "8950.00",
    "priceValidUntil": "2027-12-31",
    "itemCondition": "https://schema.org/NewCondition",
    "availability": "https://schema.org/InStock",
    "seller": {
      "@type": "Organization",
      "name": "Luxury Timepieces LLC"
    }
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.9",
    "reviewCount": "42"
  }
}
</script>`
    }
  }
];
