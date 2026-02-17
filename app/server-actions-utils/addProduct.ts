"use server";

import ProductDAO from "../api/Mongo-DB/dataaccessobject/productdao";
import cloudinary from "../server-actions-utils/cloudinary";

export async function addProduct(formData: FormData) {
  try {
    const category = formData.get("category") as string;
    const name = formData.get("name") as string;
    const image = formData.get("image") as File;
    const price = Number(formData.get("price"));
    const stock = Number(formData.get("stock"));
    const description = formData.get("description") as string;

    // Validation
    if (
      !image ||
      !name ||
      Number.isNaN(price) ||
      Number.isNaN(stock) ||
      !description ||
      !category
    ) {
      return { error: "All fields are required." };
    }

    // Convert image to buffer
    const arrayBuffer = await image.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    // Upload to Cloudinary
    const imageResponse: any = await new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            resource_type: "auto",
            folder: "pocketwatches",
          },
          (error, result) => {
            if (error) return reject(error);
            return resolve(result);
          },
        )
        .end(buffer);
    });

    // Store in DB
    await ProductDAO.create({
      image: imageResponse.secure_url,
      name,
      price,
      stock,
      description,
      category
    });

    return { success: true };
  } catch (error: any) {
    console.error("Add Product Error:", error);

    return {
      error: "Something went wrong while adding the product.",
    };
  }
}
