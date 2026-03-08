"use client";
import Image from "next/image";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";
const Footer = () => {
  return (
    <footer className="px-4 md:px-12 py-6 bg-white text-black">
      <div className="flex flex-wrap justify-center gap-6 py-4 text-lg font-bold">
        <Link href="/privacy-policy">Privacy Policy</Link>
        <Link href="/">VPAT</Link>
        <Link href="/">Accessibility</Link>
        <Link href="/">Terms</Link>
        <Link href="/">Contact</Link>
      </div>

      <div className="text-sm text-center space-y-1">
        <p>[Ricardo Rodriguez En-visioning Solutions]</p>
        <p>
          &copy; 2026
          {new Date().getFullYear() > 2026
            ? `–${new Date().getFullYear()}`
            : ""}
        </p>
        <p>All rights reserved.</p>
        <p>Image data provided by Pexels.</p>
      </div>

      <div className="flex justify-center py-4">
        <img
          height={50}
          width={150}
          src="/assets/images/envisioningsolutionslogo.png"
          alt="En-Visioning Solutions, redirects to my personal site"
        />
      </div>
    </footer>
  );
};
export default Footer;