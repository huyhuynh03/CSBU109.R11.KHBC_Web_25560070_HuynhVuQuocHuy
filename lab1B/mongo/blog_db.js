// ============================================================
// Homework 2 (Set B): Build and Manage a Blog System on MongoDB
// DB: blog_db | Collection: posts
// Chay: mongosh < mongo/blog_db.js
//      hoac: mongosh "mongodb://127.0.0.1:27017/blog_db" -f mongo/blog_db.js
// ============================================================
use('blog_db');

db.posts.drop();

db.posts.insertMany([
  {
    title: 'Getting Started with Node.js',
    category: 'Tech',
    views: 150,
    author: { name: 'Nguyen Van A', email: 'a@example.com' },
    tags: ['nodejs', 'express', 'backend'],
    comments: [
      { user: 'Binh', content: 'Great intro!', created_at: new Date('2026-09-01') },
      { user: 'Hoa', content: 'Very helpful, thanks!', created_at: new Date('2026-09-02') }
    ]
  },
  {
    title: 'Express Middleware Explained',
    category: 'Tech',
    views: 90,
    author: { name: 'Tran Thi B', email: 'b@example.com' },
    tags: ['nodejs', 'middleware'],
    comments: [
      { user: 'Dat', content: 'Clear explanation.', created_at: new Date('2026-09-03') }
    ]
  },
  {
    title: 'My Trip to Da Lat',
    category: 'Travel',
    views: 200,
    author: { name: 'Le Van C', email: 'c@example.com' },
    tags: ['travel', 'dalat'],
    comments: [
      { user: 'Mai', content: 'Beautiful place!', created_at: new Date('2026-09-04') }
    ]
  }
]);

print('--- Query 1: Tech category AND views >= 100 ---');
printjson(db.posts.find({ category: 'Tech', views: { $gte: 100 } }).toArray());

print('--- Query 2: tagged with nodejs ---');
printjson(db.posts.find({ tags: 'nodejs' }).toArray());

print('--- Update: $push comment + $inc views by title ---');
db.posts.updateOne(
  { title: 'Getting Started with Node.js' },
  {
    $push: { comments: { user: 'Hung', content: 'Thanks for sharing!', created_at: new Date() } },
    $inc: { views: 1 }
  }
);
printjson(db.posts.findOne({ title: 'Getting Started with Node.js' }));

print('--- Aggregation: totalViews + totalPosts grouped by category ---');
printjson(
  db.posts.aggregate([
    { $group: { _id: '$category', totalViews: { $sum: '$views' }, totalPosts: { $sum: 1 } } },
    { $sort: { _id: 1 } }
  ]).toArray()
);
