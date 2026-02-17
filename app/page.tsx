import Image from "next/image";
import AddProduct from "./admin/add-product/page";
import Hero from "./components/Hero";
import ProductList from "./components/ProductList";
import Footer from "./components/Footer";
export default function Home() {
  return (
    <main>
      {" "}
            <Hero />          
  
            <ProductList />    
      <Footer />
    </main>
  );
}
