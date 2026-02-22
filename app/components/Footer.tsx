import Image from "next/image";

const Footer = () => {
  return (
    <footer>
      {" "}
           {" "}
      <p className="text-sm text-center px-2 md:px-2 py-1 md:py-1">
        {" "}
        [Ricardo Rodriguez En-visioning Solutions].{" "}
      </p>
      <p className="text-sm text-center px-2 md:px-2 py-1 md:py-1">
        &copy; 2026
        {new Date().getFullYear() > 2026
          ? `–${new Date().getFullYear()}`
          : ""}{" "}
      </p>
      <p className="text-sm text-center px-2 md:px-2 py-1 md:py-1">
        All rights reserved.
      </p>
      <p className="text-sm text-center px-2 md:px-2 py-1 md:py-1">
        Image data provided by [Pexeles].
      </p>
      <div className="flex justify-center py-4">
        <img
          height={50}
          width={150}
          src="/assets/images/envisioningsolutionslogo.png"
          alt="En-Visioning Solutions, redirects to my personal site"
        />
      </div>
         {" "}
    </footer>
  );
};
export default Footer;