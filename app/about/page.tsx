"use client";
import { useEffect } from "react";
import { useStateContext } from "../context/statecontext";

export default function About() {
 


  return (
<div className="min-h-screen flex flex-col items-center px-6 py-16"> 
         <h1 className="text-3xl font-bold mb-4"> About Us</h1>

      <p className="text-gray-600 text-md text-center mb-6">This site is a practice e-commerce project designed to teach my self skills in implementing
        guard rails against inaccessible code in my git hub pipeline.
        </p>
        <p className="text-gray-600 text-md text-center mb-6">
         The site is built with Next.js 13, React, and TypeScript, and features a simple product catalog and shopping cart functionality. 
         </p>
         <p className="text-gray-600 text-md text-center mb-6">
         No items will ship and all pii is encrypted and deleted after 24 hours. 
         </p>

   
    </div>
  );
}
