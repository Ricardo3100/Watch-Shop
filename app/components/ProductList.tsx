import ProductDAO from "../api/Mongo-DB/dataaccessobject/productdao";
import ProductCard from "./ProductCard"; // client component

export default async function ProductList() {
  const products = await ProductDAO.getAll();
function getRandomItems<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => 0.5 - Math.random()); // shuffle array
  return shuffled.slice(0, count); // take first `count` items
}

  const pocketWatches = getRandomItems(
    products.filter((p: any) => p.category === "pocket-watch"),
    2,
  );

  const smartWatches = getRandomItems(
    products.filter((p: any) => p.category === "smart-watch"),
    2,
  );

  const wristWatches = getRandomItems(
    products.filter((p: any) => p.category === "wrist-watch"),
    2,
  );

  const renderSection = (title: string, items: any[]) => (
    <div className="mb-16">
      <h2 className="text-2xl font-bold mb-6">{title}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
        {/* Use the client ProductCard here */}
        {items.map((product: any) => (
          <ProductCard key={product._id.toString()} product={product} />
        ))}
      </div>
      <div className="mt-6">
        <a
          href={`/category/${title.toLowerCase().replace(" ", "-")}`}
          className="text-sm underline"
        >
          View all →
        </a>
      </div>
    </div>
  );

  return (
    <section className="w-full py-12">
      <div className="max-w-7xl text-center mx-auto px-4">
        {renderSection("Pocket Watches", pocketWatches)}
        {renderSection("Smart Watches", smartWatches)}
        {renderSection("Wrist Watches", wristWatches)}
      </div>
    </section>
  );
}
