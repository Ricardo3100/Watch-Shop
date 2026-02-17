"use client";
import { StaticImport } from "next/dist/shared/lib/get-img-props";
import { addProduct } from "../server-actions-utils/addProduct";
import { useState } from "react";
import Image from "next/image";
import { useEffect } from "react";
import toast from "react-hot-toast";
import { ChangeEvent } from "react";
const AddForm = () => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
    // state variable will store image preview
    const [imageUrl, setImageUrl] = useState<string | StaticImport>("");
const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (file) {
    const fileSize = file.size;
    if (Math.round(fileSize / 1024) > 1024) {
      alert("Image greater than 1mb is not accepted.");
    } else {
      setImageUrl(URL.createObjectURL(file));
    } 
  }
};

 async function clientAddProduct(formData: FormData) {
   const result = await addProduct(formData);

   if (result?.success) {
     toast.success("Product added successfully!");
     setImageUrl("");
   }

   if (result?.error) {
     toast.error("There was a problem  adding a product!");
   }
 }

  return (
    <form
      action={clientAddProduct}
      className="w-full max-w-xl mx-auto flex flex-col justify-center items-center space-y-4 mt-3 md:mt-5"
    >
      <div className="flex flex-col w-full">
        {" "}
                <label className="">Product Image:</label>        
        <input
          type="file"
          accept="image/*"
          name="image"
          onChange={handleImageChange}
          className="w-full px-3 py-1.5 md:py-2 text-[#252422] rounded-lg  bg-white border border-gray-500"
        />
           
        <div className="flex flex-col w-full">
          {" "}
          {/* image preview field here */}
          {mounted && imageUrl ? (
            <Image
              src={imageUrl}
              alt="Preview"
              width={1000}
              height={1000}
              className="max-w-full max-h-72 object-cover object-center rounded-lg"
            />
          ) : null}
          <div className="flex flex-col w-full">
            <label>Category:</label>
            <select
              name="category"
              className="w-full px-3 py-1.5 md:py-2 text-[#252422] rounded-lg bg-white border border-gray-500"
            >
              <option value="">Select Category</option>
              <option value="pocket-watch">Pocket Watch</option>
              <option value="wrist-watch">Wrist Watch</option>
              <option value="smart-watch">Smart Watch</option>
              <option value="grandfather-clock">Grandfather Clock</option>
              <option value="wall-clock">Wall Clock</option>
            </select>
          </div>
                  <label className="">Name:</label>
          <input
            type="text"
            name="name"
            placeholder="Enter the product name"
            className="w-full px-3 py-1.5 md:py-2 text-[#252422] rounded-lg bg-white border border-gray-500"
          />{" "}
               {" "}
        </div>
        {/* // price */}
        <div className="flex flex-col w-full">
          {" "}
                  <label className="">Price:</label>        {" "}
          <input
            type="number"
            name="price"
            placeholder="Enter the product price"
            className="w-full px-3 py-1.5 md:py-2 text-[#252422] rounded-lg bg-white border border-gray-500"
          />{" "}
               {" "}
        </div>
        {/* stock  */}
        <div className="flex flex-col w-full">
          {" "}
          <label>Stock Quantity:</label>
          <input
            type="number"
            name="stock"
            placeholder="How many in stock "
            className="w-full px-3 py-1.5 md:py-2 text-[#252422] rounded-lg bg-white border border-gray-500"
          />{" "}
               {" "}
        </div>
        {/* description field */}
        <div className="flex flex-col w-full">
          {" "}
                  <label className="">Description:</label>        {" "}
          <textarea
            rows={4}
            name="description"
            placeholder="Enter the product description"
            className="w-full px-3 py-1.5 resize-none md:py-2 text-[#252422] rounded-lg bg-white border
border-gray-500"
          />{" "}
               {" "}
        </div>
        <button
          type="submit"
          className="w-full bg-[#212529] hover:bg-[#343A40] text-white px-3 py-2 rounded-md"
        >
          {" "}
                  Add Product      {" "}
        </button>
      </div>
    </form>
  );
};
export default AddForm;
