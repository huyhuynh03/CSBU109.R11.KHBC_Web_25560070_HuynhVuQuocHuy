// Mongoose schema definition for Category
const mongoose = require('mongoose');

// "Home & Living" -> "home-living"
const slugify = (text) =>
  String(text)
    .normalize('NFD') // split accented characters into base + diacritic
    .replace(/[\u0300-\u036f]/g, '') // drop the diacritics
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-') // non-alphanumerics become dashes
    .replace(/^-+|-+$/g, ''); // trim leading/trailing dashes

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Category name is required'],
      trim: true,
      minlength: [3, 'Category name must be at least 3 characters'],
      unique: true
    },
    slug: {
      type: String,
      required: [true, 'Category slug is required'],
      trim: true,
      lowercase: true,
      unique: true
    },
    description: {
      type: String,
      trim: true,
      default: ''
    }
  },
  { timestamps: true }
);

// Generate the slug automatically from the name.
// NOTE: this must run on "validate" (not "save"), otherwise the
// required:true check on slug would fail before the hook ever fires.
categorySchema.pre('validate', function generateSlug(next) {
  if (this.isModified('name') || !this.slug) {
    this.slug = slugify(this.name);
  }
  next();
});

// Friendly duplicate-key error message (E11000 -> 409 Conflict)
categorySchema.post('save', function handleDuplicate(err, doc, next) {
  if (err && err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || 'name or slug';
    return next(
      Object.assign(new Error(`Category with the same ${field} already exists`), {
        status: 409
      })
    );
  }
  next(err);
});

categorySchema.statics.slugify = slugify;

module.exports = mongoose.model('Category', categorySchema);
