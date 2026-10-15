const BASE_URL = "https://dummyjson.com";

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (!res.ok) {
    throw new Error(`Request failed (${res.status})`);
  }

  return res.json();
}

// GET /posts?limit=10&skip=0 -> { posts, total, skip, limit }
export function getPosts({ limit = 10, skip = 0 } = {}) {
  return request(`/posts?limit=${limit}&skip=${skip}`);
}

// GET /posts/search?q=keyword -> { posts, total, skip, limit }
export function searchPosts(keyword) {
  return request(`/posts/search?q=${encodeURIComponent(keyword)}`);
}

// GET /posts/{id}
export function getPostById(id) {
  return request(`/posts/${id}`);
}

// GET /posts/{id}/comments -> { comments: [{ body, user: { username } }] }
export function getPostComments(id) {
  return request(`/posts/${id}/comments`);
}

// POST /posts/add -> the new post (not persisted on the server)
export function addPost({ title, body, userId = 1 }) {
  return request("/posts/add", {
    method: "POST",
    body: JSON.stringify({ title, body, userId }),
  });
}

// DELETE /posts/{id} -> { ...post, isDeleted: true, deletedOn }
export function deletePost(id) {
  return request(`/posts/${id}`, { method: "DELETE" });
}
