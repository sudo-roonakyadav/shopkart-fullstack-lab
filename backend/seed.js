/**
 * ============================================================================
 * File: backend/seed.js
 * Purpose: Database Seeder Script
 * ----------------------------------------------------------------------------
 * What this file does:
 * - Connects to MongoDB and seeds initial demo data.
 * - Clears existing products and populates 10 Linux distribution items (Ubuntu,
 *   Fedora, Debian, Arch, Mint, Kali, Pop!_OS, openSUSE, Alpine, Rocky Linux).
 * - Creates demo customer and administrator accounts for presentation testing.
 * ============================================================================
 */
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Product = require('./models/product.model');
const connectDB = require('./config/db');

dotenv.config();

const linuxProducts = [
  {
    name: 'Ubuntu 24.04 LTS Noble Numbat ISO',
    description: 'Long-term support Linux distribution featuring GNOME 46 desktop, Linux Kernel 6.8, and 5 years of security updates. Verified bootable x86_64 image.',
    price: 399,
    category: 'Desktop Distributions',
    image: '/images/distros/ubuntu.svg',
    stock: 50
  },
  {
    name: 'Fedora Workstation 40 ISO',
    description: 'Leading-edge Linux workstation featuring stock GNOME desktop environment, Wayland display server, and RPM package management. Built for developers.',
    price: 349,
    category: 'Desktop Distributions',
    image: '/images/distros/fedora.svg',
    stock: 45
  },
  {
    name: 'Debian 12 Bookworm Netinst ISO',
    description: 'The Universal Operating System renowned for rock-solid stability, APT package manager, and Free Software philosophy. Ideal for robust servers and desktops.',
    price: 299,
    category: 'Server & Enterprise',
    image: '/images/distros/debian.svg',
    stock: 60
  },
  {
    name: 'Arch Linux x86_64 Minimal ISO',
    description: 'Lightweight and flexible rolling-release distribution adhering to the KISS principle. Includes pacman package manager, systemd, and documentation.',
    price: 499,
    category: 'Rolling Release',
    image: '/images/distros/arch.svg',
    stock: 30
  },
  {
    name: 'Linux Mint 22 Wilma Cinnamon Edition ISO',
    description: 'Refined and modern desktop operating system designed for elegance, ease of use, and out-of-the-box multimedia support with Cinnamon desktop.',
    price: 249,
    category: 'Desktop Distributions',
    image: '/images/distros/mint.svg',
    stock: 40
  },
  {
    name: 'Kali Linux 2024 Complete Security ISO',
    description: 'Advanced penetration testing and ethical hacking distribution loaded with hundreds of security assessment, forensics, and reverse-engineering tools.',
    price: 799,
    category: 'Security & Forensics',
    image: '/images/distros/kali.svg',
    stock: 25
  },
  {
    name: 'openSUSE Tumbleweed Rolling ISO',
    description: 'Pure rolling-release Linux distribution featuring openQA automated testing, YaST control center, and Zypper package management with Btrfs snapshots.',
    price: 399,
    category: 'Rolling Release',
    image: '/images/distros/opensuse.svg',
    stock: 35
  },
  {
    name: 'Pop!_OS 22.04 LTS COSMIC ISO',
    description: 'Designed for STEM and creative professionals by System76. Features native window tiling, flatpak integration, and hybrid graphics switching.',
    price: 449,
    category: 'Desktop Distributions',
    image: '/images/distros/popos.svg',
    stock: 20
  },
  {
    name: 'Rocky Linux 9 Enterprise Server ISO',
    description: '100% bug-for-bug compatible enterprise operating system designed as a drop-in replacement for CentOS and Red Hat Enterprise Linux (RHEL).',
    price: 599,
    category: 'Server & Enterprise',
    image: '/images/distros/rocky.svg',
    stock: 50
  },
  {
    name: 'Alpine Linux 3.20 Standard ISO',
    description: 'Security-oriented, lightweight Linux distribution based on musl libc and busybox. Ultra-fast boot, minimal memory footprint, perfect for containers and routers.',
    price: 199,
    category: 'Server & Enterprise',
    image: '/images/distros/alpine.svg',
    stock: 100
  }
];

const seedProducts = async () => {
  try {
    await Product.deleteMany({});
    console.log('Cleared existing products.');

    const created = await Product.insertMany(linuxProducts);
    console.log(`Successfully seeded ${created.length} Linux distribution products.`);
  } catch (error) {
    console.error('Error seeding products:', error);
  }
};

// If run directly: node seed.js
if (require.main === module) {
  connectDB().then(async () => {
    await seedProducts();
    console.log('Seeding complete. Exiting...');
    process.exit(0);
  });
}

module.exports = { seedProducts, linuxProducts };
