import { useState } from "react";
import PostListPage from "./pages/PostListPage.jsx";
import PostDetailPage from "./pages/PostDetailPage.jsx";

export default function App() {
  const [selectedPost, setSelectedPost] = useState(null);

  return (
    <main className="container">
      <h1>Mini Blog Manager</h1>

      {/* Giữ list mounted khi xem chi tiết để không mất các thay đổi trong state */}
      <div hidden={selectedPost !== null}>
        <PostListPage onView={setSelectedPost} />
      </div>

      {selectedPost && (
        <PostDetailPage
          key={selectedPost.id}
          post={selectedPost}
          onBack={() => setSelectedPost(null)}
        />
      )}
    </main>
  );
}
