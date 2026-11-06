// Ảnh placeholder (SVG inline) hiển thị khi không có image prop
const PLACEHOLDER =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="130">' +
      '<rect width="100%" height="100%" fill="#e5e7eb"/>' +
      '<text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" ' +
      'fill="#9ca3af" font-family="Arial" font-size="14">No image</text></svg>'
  );

export default function ProductCard({
  name,
  price,
  inStock = true,
  image = PLACEHOLDER,
  children,
}) {
  return (
    <div className="card">
      {price < 20 && <span className="badge">Low price!</span>}
      <img src={image} alt={name} />
      <h3>{name}</h3>
      <p>{price.toLocaleString()} USD</p>
      {inStock ? (
        <span className="stock in">In stock</span>
      ) : (
        <span className="stock out">Sold out</span>
      )}
      {children}
    </div>
  );
}
