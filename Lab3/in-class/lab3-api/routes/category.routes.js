// Express Router configuration for /api/categories
const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/category.controller');

/**
 * @swagger
 * tags:
 *   - name: Categories
 *     description: Category management endpoints
 *
 * components:
 *   schemas:
 *     Category:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         _id:
 *           type: string
 *           description: Auto-generated ID from MongoDB
 *           example: 66a7c2b416747184e0b762b1
 *         name:
 *           type: string
 *           example: Home & Living
 *         slug:
 *           type: string
 *           description: Auto-generated from the name
 *           example: home-living
 *         description:
 *           type: string
 *           example: Furniture, decor and household items
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     CategoryInput:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         name:
 *           type: string
 *           minLength: 3
 *           example: Home & Living
 *         description:
 *           type: string
 *           example: Furniture, decor and household items
 *     CategoryPaginatedList:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         count:
 *           type: integer
 *           example: 2
 *         pagination:
 *           type: object
 *           properties:
 *             currentPage:
 *               type: integer
 *               example: 1
 *             totalPages:
 *               type: integer
 *               example: 1
 *             totalCategories:
 *               type: integer
 *               example: 2
 *         data:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Category'
 *     CategoryErrorResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         error:
 *           type: string
 *           example: No category found with the given ID
 *   parameters:
 *     CategoryId:
 *       in: path
 *       name: id
 *       required: true
 *       description: MongoDB ObjectId of the category
 *       schema:
 *         type: string
 *       example: 66a7c2b416747184e0b762b1
 */

/**
 * @swagger
 * /categories:
 *   get:
 *     summary: Get the list of categories
 *     tags: [Categories]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Current page (default = 1)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 5
 *         description: Number of items per page (default = 5)
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [name, slug, createdAt, updatedAt]
 *           default: createdAt
 *         description: Field used for sorting
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort direction
 *     responses:
 *       200:
 *         description: Categories retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CategoryPaginatedList'
 *       500:
 *         description: Internal server error
 *   post:
 *     summary: Create a new category
 *     description: The slug is generated automatically from the name.
 *     tags: [Categories]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CategoryInput'
 *     responses:
 *       201:
 *         description: Category created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Category created successfully
 *                 data:
 *                   $ref: '#/components/schemas/Category'
 *       400:
 *         description: Name empty or shorter than 3 characters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CategoryErrorResponse'
 *       409:
 *         description: Duplicate name or slug (error code 11000)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CategoryErrorResponse'
 */
router.get('/', categoryController.getAllCategories);
router.post(
  '/',
  categoryController.validateCreateCategory,
  categoryController.createCategory
);

/**
 * @swagger
 * /categories/{id}:
 *   get:
 *     summary: Get a category by ID
 *     tags: [Categories]
 *     parameters:
 *       - $ref: '#/components/parameters/CategoryId'
 *     responses:
 *       200:
 *         description: Category found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Category'
 *       400:
 *         description: Malformed ObjectId (CastError)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CategoryErrorResponse'
 *       404:
 *         description: No category found with the given ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CategoryErrorResponse'
 *   patch:
 *     summary: Partially update a category by ID
 *     description: Only the fields sent in the body are changed. The slug is regenerated whenever the name changes.
 *     tags: [Categories]
 *     parameters:
 *       - $ref: '#/components/parameters/CategoryId'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CategoryInput'
 *     responses:
 *       200:
 *         description: Category updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Category updated successfully
 *                 data:
 *                   $ref: '#/components/schemas/Category'
 *       400:
 *         description: Validation failed or malformed ObjectId
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CategoryErrorResponse'
 *       404:
 *         description: No category found to update
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CategoryErrorResponse'
 *       409:
 *         description: Duplicate name or slug (error code 11000)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CategoryErrorResponse'
 *   delete:
 *     summary: Delete a category by ID
 *     tags: [Categories]
 *     parameters:
 *       - $ref: '#/components/parameters/CategoryId'
 *     responses:
 *       200:
 *         description: Category deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Category deleted successfully
 *       400:
 *         description: Malformed ObjectId (CastError)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CategoryErrorResponse'
 *       404:
 *         description: No category found to delete
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CategoryErrorResponse'
 */
router.get('/:id', categoryController.getCategoryById);
router.patch(
  '/:id',
  categoryController.validatePatchCategory,
  categoryController.updateCategory
);
router.delete('/:id', categoryController.deleteCategory);

module.exports = router;
