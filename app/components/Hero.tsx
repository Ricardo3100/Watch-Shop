import Link from "next/link"; 
import React from "react"; 
import Image from "next/image";
const Hero = () => {
  return (
    <div className="min-h-[70vh] md:min-h-[60vh] lg:min-h-[90vh] flex flex-col md:flex-row justify-center items-center bg-[#fff] px-4 md:px-12 pb-16 text-black gap-10">
      {/* LEFT COLUMN */}
      <div className="flex flex-col w-full md:w-1/2 max-w-xl">
        <h1 className="text-5xl pt-6 md:pt-0 md:text-7xl leading-tight font-semibold">
          Timeless Elegance in Your Pocket Or On You're Wrist
        </h1>

        <p className="mt-6 text-lg text-black/70">
          Discover our curated collection of premium watches, crafted for those
          who appreciate sophistication and precision.
        </p>

        <Link href="/shop">
          <button className="mt-3 bg-[#212529] hover:bg-[#343A40] text-white px-4 py-3 rounded-md">
            Shop the Collection
          </button>
        </Link>
      </div>

      {/* RIGHT COLUMN */}
      <div className="w-full md:w-1/2">
        <Image
          src="/assets/images/watch2.jpg"
          alt="Luxury watch"
          width={1000}
          height={1000}
          className="rotate-1 hover:rotate-0 transition-transform duration-500 p-4 bg-black rounded-3xl shadow-xl"
          priority
        />
      </div>
    </div>
  );
};

export default Hero; 