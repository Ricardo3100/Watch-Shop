"use client";

import { useRouter } from "next/navigation";
import { AiOutlineArrowLeft } from "react-icons/ai";

export default function BackButton() {
  const router = useRouter();

  return (
    <button
      onClick={() => router.back()}
      className="flex items-center gap-2 text-neutral-700 hover:text-black transition mb-8"
    >
      <AiOutlineArrowLeft size={20} />
      <span className="font-medium">Back</span>
    </button>
  );
}
