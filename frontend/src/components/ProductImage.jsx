/**
 * ============================================================================
 * File: frontend/src/components/ProductImage.jsx
 * Purpose: Resilient Distribution Badge & Image Renderer
 * ----------------------------------------------------------------------------
 * What this file does:
 * - Renders high-fidelity SVG logos for Linux distributions (Ubuntu, Arch, Debian, etc.).
 * - Implements graceful fallback to clean typographic badges if an image fails to load.
 * ============================================================================
 */
import React, { useState } from 'react';

// Map distribution keywords to dedicated local vector assets
const getDistroAsset = (name = '') => {
  const lower = name.toLowerCase();
  if (lower.includes('ubuntu')) return '/images/distros/ubuntu.svg';
  if (lower.includes('fedora')) return '/images/distros/fedora.svg';
  if (lower.includes('debian')) return '/images/distros/debian.svg';
  if (lower.includes('arch')) return '/images/distros/arch.svg';
  if (lower.includes('mint')) return '/images/distros/mint.svg';
  if (lower.includes('kali')) return '/images/distros/kali.svg';
  if (lower.includes('suse')) return '/images/distros/opensuse.svg';
  if (lower.includes('pop')) return '/images/distros/popos.svg';
  if (lower.includes('rocky')) return '/images/distros/rocky.svg';
  if (lower.includes('alpine')) return '/images/distros/alpine.svg';
  return null;
};

const ProductImage = ({ product, className = '', containerClassName = '' }) => {
  const [loadFailed, setLoadFailed] = useState(false);

  const productName = product?.name || 'Linux Distribution';
  const localAsset = getDistroAsset(productName);

  // Determine initial source: prefer local dedicated vector asset for stability
  const initialSrc =
    localAsset ||
    (product?.image && product.image.startsWith('/images/distros/')
      ? product.image
      : localAsset || product?.image);

  if (loadFailed || !initialSrc) {
    // Clean typographic product fallback with the product's OWN name (NEVER Tux or other distros)
    return (
      <div className={`distro-fallback-visual ${containerClassName}`}>
        <div className="distro-fallback-inner">
          <span className="distro-fallback-badge">LINUX</span>
          <span className="distro-fallback-title">{productName.split(' ')[0]}</span>
          <span className="distro-fallback-sub">OFFICIAL ISO</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`distro-image-container ${containerClassName}`}>
      <img
        src={initialSrc}
        alt={productName}
        className={`distro-img ${className}`}
        loading="lazy"
        onError={() => setLoadFailed(true)}
      />
    </div>
  );
};

export default ProductImage;
