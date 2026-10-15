const BASE_URL = "https://dummyjson.com";

export const PAGE_SIZE = 12;

// GET /products?limit=12&skip=(page-1)*12
export async function fetchProducts(page = 1) {
  const skip = (page - 1) * PAGE_SIZE;
  const res = await fetch(
    `${BASE_URL}/products?limit=${PAGE_SIZE}&skip=${skip}`
  );
  if (!res.ok) {
    throw new Error(`Yêu cầu thất bại (HTTP ${res.status})`);
  }
  // Trả về { products, total, skip, limit }
  return res.json();
}

// GET /products/{id}
export async function fetchProductById(id) {
  const res = await fetch(`${BASE_URL}/products/${id}`);
  if (!res.ok) {
    throw new Error(`Không tải được sản phẩm (HTTP ${res.status})`);
  }
  return res.json();
}
