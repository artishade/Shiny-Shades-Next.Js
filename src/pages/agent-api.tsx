/* ===================================================
   - AI Agent API Documentation (public page)
   How external AI agents connect to and interact
   with the Shiny Shades website.
   =================================================== */

import React, { type ReactElement } from 'react';
import { BRAND } from '@/config/brandingConfig';
import type { NextPageWithLayout } from '@/types/layout';
import { CustomerLayout } from '@/components/layout/CustomerLayout';

const AgentApiPage: NextPageWithLayout = () => {
  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <h1 className="heading-serif text-3xl md:text-4xl font-bold text-charcoal mb-2">
        AI Agent API
      </h1>
      <p className="text-[#6B5B55] mb-6">
        {BRAND.nameTop} {BRAND.nameBottom} exposes a REST API for AI agents (Claude, Codex, etc.) to
        analyze and interact with website data.
      </p>

      <div className="prose prose-sm text-charcoal max-w-none">
        <h2>Authentication</h2>
        <p>
          All requests require a bearer token obtained from the admin panel at <code>/admin/agent-keys</code>.
          Only admin-level tokens can be provisioned.
        </p>
        <pre className="bg-gray-50 p-3 rounded text-xs">Authorization: Bearer sk_live_...</pre>

        <h2>Endpoint</h2>
        <p>
          <strong>POST</strong> <code>/api/agent/website</code> — Content-Type: application/json
        </p>

        <h2>Actions</h2>

        <h3>analyze</h3>
        <p>Returns a site overview: product catalog health, categories, recent orders, low stock items.</p>
        <pre className="bg-gray-50 p-3 rounded text-xs">
{`{
  "action": "analyze"
}`}
        </pre>

        <h3>metrics</h3>
        <p>
          Performance signals derived from store data: revenue by day, payment method breakdown,
          order status flow, inventory health. Requires <code>analytics</code> permission.
        </p>
        <pre className="bg-gray-50 p-3 rounded text-xs">
{`{
  "action": "metrics",
  "params": { "days": 30 }
}`}
        </pre>

        <h3>products</h3>
        <p>List products with optional filters. Requires <code>read</code> permission.</p>
        <pre className="bg-gray-50 p-3 rounded text-xs">
{`{
  "action": "products",
  "params": {
    "limit": 50,
    "category": "sarees",
    "search": "silk",
    "includeInactive": false
  }
}`}
        </pre>

        <h3>orders</h3>
        <p>List recent orders with optional filters. Requires <code>read</code> permission.</p>
        <pre className="bg-gray-50 p-3 rounded text-xs">
{`{
  "action": "orders",
  "params": {
    "limit": 50,
    "days": 30,
    "status": "delivered"
  }
}`}
        </pre>

        <h3>categories</h3>
        <p>List categories. Requires <code>read</code> permission.</p>
        <pre className="bg-gray-50 p-3 rounded text-xs">
{`{
  "action": "categories",
  "params": { "limit": 50 }
}`}
        </pre>

        <h3>config</h3>
        <p>Read site configuration: homepage content, categories, active coupons. Requires <code>read</code> permission.</p>
        <pre className="bg-gray-50 p-3 rounded text-xs">
{`{
  "action": "config"
}`}
        </pre>

        <h3>create</h3>
        <p>
          Create products, categories, or coupons. Requires <code>write</code> permission.
          Only available to keys created by super admins.
        </p>
        <pre className="bg-gray-50 p-3 rounded text-xs">
{`{
  "action": "create",
  "resource": "product",
  "params": {
    "name": "Floral Maxi Dress",
    "price": 2499,
    "description": "Lightweight floral print maxi dress.",
    "categoryId": "<uuid>",
    "stock": 20,
    "isFeatured": true
  }
}`}

{`{
  "action": "create",
  "resource": "category",
  "params": {
    "name": "Summer Collection",
    "description": "Light and breezy summer wear"
  }
}`}

{`{
  "action": "create",
  "resource": "coupon",
  "params": {
    "code": "SUMMER20",
    "discount": 20,
    "type": "percentage",
    "minOrderAmount": 500
  }
}`}
        </pre>

        <h3>update</h3>
        <p>Update a product, category, or coupon by ID. Requires <code>write</code> permission.</p>
        <pre className="bg-gray-50 p-3 rounded text-xs">
{`{
  "action": "update",
  "resource": "product",
  "resourceId": "<uuid>",
  "params": { "price": 1999, "stock": 50 }
}`}
        </pre>

        <h2>Permissions</h2>
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className="text-left py-2">Permission</th>
              <th className="text-left py-2">Allowed actions</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="py-2">read</td>
              <td>products, orders, categories, config</td>
            </tr>
            <tr>
              <td className="py-2">analytics</td>
              <td>metrics, analyze</td>
            </tr>
            <tr>
              <td className="py-2">write</td>
              <td>create, update, delete</td>
            </tr>
          </tbody>
        </table>

        <h2>Rate Limits</h2>
        <p>60 requests per minute per API key. Exceeding returns HTTP 429.</p>

        <h2>Error Responses</h2>
        <p>All errors return JSON with <code>error</code> and <code>code</code> fields:</p>
        <ul>
          <li><code>401 unauthorized</code> — missing or invalid key</li>
          <li><code>403 forbidden</code> — key disabled or insufficient permissions</li>
          <li><code>429 rate_limited</code> — too many requests</li>
          <li><code>400 bad_request</code> — invalid request body</li>
          <li><code>500 server_error</code> — internal error</li>
        </ul>
      </div>
    </div>
  );
};

AgentApiPage.getLayout = function getLayout(page: ReactElement) {
  return <CustomerLayout>{page}</CustomerLayout>;
};

export default AgentApiPage;
