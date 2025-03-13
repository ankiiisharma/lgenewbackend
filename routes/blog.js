const express = require("express");
const blogRoutes = express();
const cors = require("cors");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const dotenv = require("dotenv");
const isAdmin = require("../middleware/isAdmin");
const isSigned = require("../middleware/isSignedin");
const isModerator = require("../middleware/isModerator");
const { v4: uuidv4 } = require("uuid");
const rateLimit = require("express-rate-limit");

dotenv.config();
blogRoutes.use(cors());
blogRoutes.use(express.json());

// Get all blogs with author details
blogRoutes.get("/", async (req, res) => {
  try {
    const blogs = await prisma.blog.findMany({
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    res.json({ success: true, blogs });
  } catch (error) {
    console.error("Error fetching blogs:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch blogs",
    });
  }
});

// Get all blogs by author ID
blogRoutes.get("/author/:authorId", async (req, res) => {
  const { authorId } = req.params;

  try {
    const blogs = await prisma.blog.findMany({
      where: { authorId },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        comments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (blogs.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No blogs found for this author",
      });
    }

    res.json({
      success: true,
      blogs,
    });
  } catch (error) {
    console.error("Error fetching author's blogs:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch author's blogs",
    });
  }
});

// Create new blog (Admin and Moderator)
blogRoutes.post("/postBlog", isSigned, async (req, res) => {
  const { game, title, description, summary, image } = req.body;
  const authorId = req.user.id;
  const role = req.user.role;

  if (!game || !title || !description) {
    return res.status(400).json({
      success: false,
      message: "Missing required fields",
    });
  }

  try {
    const newBlog = await prisma.blog.create({
      data: {
        id: uuidv4(),
        game,
        title,
        summary,
        description,
        image: image || "",
        authorId,
        published: role === "ADMIN",
        visible: role === "ADMIN",
      },
    });

    res.status(201).json({
      success: true,
      message: "Blog created successfully",
      blog: newBlog,
    });
  } catch (error) {
    console.error("Error creating blog:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create blog",
    });
  }
});

// Update blog (Admin only)
blogRoutes.put("/updateBlog/:id", isAdmin, async (req, res) => {
  const { game, title, description, summary, image, published } = req.body;
  const { id } = req.params;

  try {
    const updatedBlog = await prisma.blog.update({
      where: { id },
      data: {
        game,
        title,
        summary,
        description,
        image,
        published: published ?? undefined,
        updatedAt: new Date(),
      },
    });

    res.json({
      success: true,
      message: "Blog updated successfully",
      blog: updatedBlog,
    });
  } catch (error) {
    console.error("Error updating blog:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update blog",
    });
  }
});

// Update blog visibility (Admin only)
blogRoutes.patch("/updateVisibility/:id", isAdmin, async (req, res) => {
  const { id } = req.params;
  const { visible } = req.body;

  try {
    const updatedBlog = await prisma.blog.update({
      where: { id },
      data: { visible },
    });

    res.json({
      success: true,
      message: "Blog visibility updated successfully",
      blog: updatedBlog,
    });
  } catch (error) {
    console.error("Error updating blog visibility:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update blog visibility",
    });
  }
});

// Delete blog (Admin only)
blogRoutes.delete("/deleteBlog/:id", isAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    // First delete all comments associated with the blog
    await prisma.comment.deleteMany({
      where: { blogId: id },
    });

    // Then delete the blog
    await prisma.blog.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: "Blog and associated comments deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting blog:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete blog",
    });
  }
});

// Get pending blogs - MOVED UP BEFORE /:game route
blogRoutes.get("/pending", isAdmin, async (req, res) => {
  try {
    const blogs = await prisma.blog.findMany({
      where: { published: false },
      include: {
        author: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    console.log("Fetched pending blogs:", blogs.length); // Add logging
    res.json({ success: true, blogs });
  } catch (error) {
    console.error("Error fetching pending blogs:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch pending blogs" });
  }
});

// Approve a blog - MOVED UP BEFORE /:game/:id route
blogRoutes.post("/:id/approve", isAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const updatedBlog = await prisma.blog.update({
      where: { id },
      data: { published: true, visible: true },
    });
    console.log("Blog approved:", updatedBlog.id); // Add logging
    res.json({
      success: true,
      message: "Blog approved successfully",
      blog: updatedBlog,
    });
  } catch (error) {
    console.error("Error approving blog:", error);
    res.status(500).json({ success: false, message: "Failed to approve blog" });
  }
});

// Get blogs by game - MOVED DOWN after more specific routes
blogRoutes.get("/:game", async (req, res) => {
  const { game } = req.params;
  try {
    const blogs = await prisma.blog.findMany({
      where: { game },
      include: {
        author: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    res.json({ success: true, blogs });
  } catch (error) {
    console.error("Error fetching blogs by game:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch blogs",
    });
  }
});

// Get specific blog by ID and game - MOVED DOWN to the bottom
blogRoutes.get("/:game/:id", async (req, res) => {
  const { game, id } = req.params;

  try {
    const blog = await prisma.blog.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        comments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: "Blog not found",
      });
    }

    if (blog.game !== game) {
      return res.status(404).json({
        success: false,
        message: "Blog not found for this game",
      });
    }
    // console.log("summary", blog.summary);
    res.json({ success: true, blog });
  } catch (error) {
    console.error("Error fetching blog:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch blog",
    });
  }
});

blogRoutes.post("/:game/:id/comments", isSigned, async (req, res) => {
  const { id: blogId } = req.params;
  const { content } = req.body;
  const userId = req.user.id;

  if (!content?.trim()) {
    return res.status(400).json({
      success: false,
      message: "Comment content cannot be empty",
    });
  }

  try {
    const newComment = await prisma.comment.create({
      data: {
        id: uuidv4(),
        content,
        blogId,
        userId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      message: "Comment added successfully",
      comment: newComment,
    });
  } catch (error) {
    console.error("Error adding comment:", error);
    res.status(500).json({
      success: false,
      message: "Failed to add comment",
    });
  }
});

module.exports = blogRoutes;
