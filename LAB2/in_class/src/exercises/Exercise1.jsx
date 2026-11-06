import ProductCard from "../components/ProductCard.jsx";

// 3 sản phẩm mẫu (Section 4.3)
const sampleProducts = [
  { id: 1, name: "Keyboard", price: 25, inStock: true },
  { id: 2, name: "Mouse", price: 12, inStock: false },
  { id: 3, name: "Monitor", price: 180, inStock: true },
];

export default function Exercise1() {
  return (
    <section>
      <h2>Products</h2>
      <div className="grid">
        {sampleProducts.map((p) => (
          <ProductCard
            key={p.id}
            name={p.name}
            price={p.price}
            inStock={p.inStock}
          />
        ))}
      </div>
    </section>
  );
}
