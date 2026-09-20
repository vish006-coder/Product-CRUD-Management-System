import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

import Product from './models/Product.js';
import User from './models/User.js';

const app = express();

const port = 5000;

const JWT_SECRET = 'secretkey';

function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      message: "Access denied. Please login."
    });
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      message: "Access denied. Token missing."
    });
  }

  jwt.verify(token, JWT_SECRET, (error, user) => {
    if (error) {
      return res.status(401).json({
        message: "Invalid or expired token."
      });
    }

    req.user = user;
    next();
  });
}

app.use(cors({
  origin: 'http://localhost:3000'
}));

app.use(bodyParser.json());

console.log("Connecting to database: productdb");

mongoose.connect("mongodb://localhost:27017/productdb")
  .then(() => {
    console.log("Connected to MongoDB Successfully!");
  })
  .catch((err) => {
    console.log("Error connecting to MongoDB:", err);
  });

app.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({
        message: "Username, email and password are required"
      });
    }

    const existingUser = await User.findOne({
      email: email
    });

    if (existingUser) {
      return res.status(400).json({
        message: "Email is already registered"
      });
    }

    const lastUser = await User.findOne().sort({
      id: -1
    });

    let newId = 1;

    if (lastUser && Number.isFinite(Number(lastUser.id))) {
      newId = Number(lastUser.id) + 1;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      id: newId,
      username: username,
      email: email,
      password: hashedPassword
    });

    console.log("Registration successful:", email);

    res.status(201).json({
      message: "Registration successful",
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email
      }
    });

  } catch (error) {
    console.error("Registration error:", error);

    res.status(500).json({
      message: "Registration failed",
      error: error.message
    });
  }
});

app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required"
      });
    }

    const user = await User.findOne({
      email: email
    });

    if (!user) {
      return res.status(401).json({
        message: "Email is not registered"
      });
    }

    const isPasswordValid = await bcrypt.compare(
      password,
      user.password
    );

    if (!isPasswordValid) {
      return res.status(401).json({
        message: "Incorrect password"
      });
    }

    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        email: user.email
      },
      JWT_SECRET,
      {
        expiresIn: "1h"
      }
    );

    console.log("Login successful:", email);

    res.status(200).json({
      message: "Login successful",
      token: token
    });

  } catch (error) {
    console.error("Login error:", error);

    res.status(500).json({
      message: "Login failed",
      error: error.message
    });
  }
});

app.get("/products", authenticateToken, async (req, res) => {
  try {
    const result = await Product.find();
    res.json(result);
  } catch (error) {
    console.error("Error fetching products:", error);

    res.status(500).json({
      message: "Error fetching products",
      error: error.message
    });
  }
});

app.post("/products", authenticateToken, async (req, res) => {
  try {
    const { name, description, price, quantity } = req.body;

    if (!name || !description || price === undefined || quantity === undefined) {
      return res.status(400).json({
        message: "Name, description, price, and quantity are required"
      });
    }

    const lastProduct = await Product.findOne().sort({
      id: -1
    });

    let newId = 1;

    if (lastProduct && Number.isFinite(Number(lastProduct.id))) {
      newId = Number(lastProduct.id) + 1;
    }

    const newProduct = {
      id: newId,
      name: name,
      description: description,
      price: Number(price),
      quantity: Number(quantity)
    };

    const savedProduct = await Product.create(newProduct);

    console.log("Product posted successfully:", savedProduct);

    res.status(201).json({
      message: "Product posted successfully",
      product: savedProduct
    });

  } catch (error) {
    console.error("Error posting product:", error);

    res.status(500).json({
      message: "Error posting product",
      error: error.message
    });
  }
});

app.delete("/product/:id", authenticateToken, async (req, res) => {
  try {
    const id = Number(req.params.id);

    const deletedProduct = await Product.findOneAndDelete({
      id: id
    });

    if (!deletedProduct) {
      return res.status(404).json({
        message: "Product not found"
      });
    }

    res.json({
      message: "Product deleted successfully",
      product: deletedProduct
    });

  } catch (error) {
    console.error("Error deleting product:", error);

    res.status(500).json({
      message: "Error deleting product",
      error: error.message
    });
  }
});

app.patch('/product/:id', authenticateToken, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const updates = {};
    if (req.body.name !== undefined) updates.name = req.body.name;
    if (req.body.description !== undefined) updates.description = req.body.description;
    if (req.body.price !== undefined) updates.price = Number(req.body.price);
    if (req.body.quantity !== undefined) updates.quantity = Number(req.body.quantity);

    const updatedProduct = await Product.findOneAndUpdate(
      { id: id },
      updates,
      { new: true }
    );

    if (!updatedProduct) {
      return res.status(404).json({
        message: 'Product not found'
      });
    }

    res.json({
      message: `Product with id ${id} updated successfully`,
      product: updatedProduct
    });

  } catch (error) {
    console.error("Error updating product:", error);

    res.status(500).json({
      message: "Error updating product",
      error: error.message
    });
  }
});

app.put('/product/:id', authenticateToken, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { name, description, price, quantity } = req.body;

    const updatedProduct = await Product.findOneAndUpdate(
      { id: id },
      {
        name: name,
        description: description,
        price: Number(price),
        quantity: Number(quantity)
      },
      { new: true }
    );

    if (!updatedProduct) {
      return res.status(404).json({
        message: 'Product not found'
      });
    }

    res.json({
      message: `Product with id ${id} updated successfully`,
      product: updatedProduct
    });

  } catch (error) {
    console.error("Error updating product:", error);

    res.status(500).json({
      message: "Error updating product",
      error: error.message
    });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});