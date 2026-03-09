import Link from "next/link";
import { AiOutlineArrowLeft, AiOutlineArrowRight } from "react-icons/ai";

export default function AccessibilityStatement() {
  return (
    <>
      <div className="flex justify-between items-center mb-8">
        <Link href="/admin/dashboard" className="flex items-center gap-2">
          <AiOutlineArrowLeft />
          Back to Dashboard
        </Link>
      </div>
      <div className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-4xl font-bold  text-center mb-2">
          Accessibility Statement
        </h1>
      </div>
    </>
  );
}
