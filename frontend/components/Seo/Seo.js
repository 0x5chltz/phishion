import React from 'react';
import Head from 'next/head';
import PropTypes from 'prop-types';

const SITE_NAME = 'Phishion';
const DEFAULT_TITLE = 'Phishing URL Threat Intelligence';
const DEFAULT_DESCRIPTION =
  'Phishion is a phishing URL threat intelligence tool for scanning suspicious links, reviewing verdicts, and running domain reconnaissance.';
const OG_IMAGE_PATH = '/img/og-default.png';

// Set NEXT_PUBLIC_SITE_URL to the public origin (no trailing slash) in production.
// Canonical, og:url and og:image are all resolved against it.
export function siteUrl() {
  const raw = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  return raw.replace(/\/+$/, '');
}

function absolute(path) {
  if (!path) return siteUrl();
  if (/^https?:\/\//i.test(path)) return path;
  return `${siteUrl()}${path.startsWith('/') ? path : `/${path}`}`;
}

export default function Seo({ title, description, path, noindex }) {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} | ${DEFAULT_TITLE}`;
  const metaDescription = description || DEFAULT_DESCRIPTION;
  const canonical = absolute(path || '/');
  const image = absolute(OG_IMAGE_PATH);

  return (
    <Head>
      <title key="title">{fullTitle}</title>
      <meta key="description" name="description" content={metaDescription} />
      <link key="canonical" rel="canonical" href={canonical} />

      {noindex && <meta key="robots" name="robots" content="noindex,nofollow" />}

      <meta key="og:site_name" property="og:site_name" content={SITE_NAME} />
      <meta key="og:type" property="og:type" content="website" />
      <meta key="og:title" property="og:title" content={fullTitle} />
      <meta key="og:description" property="og:description" content={metaDescription} />
      <meta key="og:url" property="og:url" content={canonical} />
      <meta key="og:image" property="og:image" content={image} />

      <meta key="twitter:card" name="twitter:card" content="summary_large_image" />
      <meta key="twitter:title" name="twitter:title" content={fullTitle} />
      <meta key="twitter:description" name="twitter:description" content={metaDescription} />
      <meta key="twitter:image" name="twitter:image" content={image} />
    </Head>
  );
}

Seo.propTypes = {
  title: PropTypes.string,
  description: PropTypes.string,
  // Route path used for the canonical URL and og:url, e.g. "/history".
  path: PropTypes.string,
  noindex: PropTypes.bool,
};

Seo.defaultProps = {
  title: undefined,
  description: undefined,
  path: '/',
  noindex: false,
};
