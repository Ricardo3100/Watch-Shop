import clientPromise from "../../../api/Mongo-DB/mongodb";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const client = await clientPromise;

    // Ping the database
    await client.db().command({ ping: 1 });

    return NextResponse.json({
      success: true,
      message: "Connected to MongoDB successfully 🚀",
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 },
    );
  }
}
