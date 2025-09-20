import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import db from "../db.js";

const router = express.Router();

router.post("/register", (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "Please provide both email and password" });
  }

  if (password.length < 6) {
    return res.status(400).json({ message: "Password must be at least 6 characters long" });
  }

  if (!username.includes('@')) {
    return res.status(400).json({ message: "Please enter a valid email address" });
  }

  const hashedPassword = bcrypt.hashSync(password, 8);

  try {
    const insertedUser = db.prepare(
      `INSERT INTO user (username , password) VALUES (?, ?)`
    );
    const result = insertedUser.run(username, hashedPassword);
    const defaultTodo = `Hello :) add your first todo!`;

    const insertTodo = db.prepare(
      `INSERT INTO todo (user_id ,task) VALUES(?, ?)`
    );
    insertTodo.run(result.lastInsertRowid, defaultTodo);

    const incrementUsersNumberStmt = db.prepare(
      `UPDATE num_users SET count = count + 1`
    );
    incrementUsersNumberStmt.run();

    const getUsersNumberStmt = db.prepare(`SELECT count FROM num_users`);
    const usersNumber = getUsersNumberStmt.get();

    console.log("Number of users:", usersNumber.count);

    const token = jwt.sign(
      { id: result.lastInsertRowid },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );
    res.json({ token });
  } catch (err) {
    console.log(err.message);
    if (err.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json({ message: "This email is already registered. Try logging in instead!" });
    }
    res.status(500).json({ message: "Something went wrong on our end. Please try again later." });
  }
});

router.post("/login", (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "Please enter your email and password" });
  }

  try {
    const getUser = db.prepare("SELECT * FROM user WHERE username = ?");

    const user = getUser.get(username);
    if (!user) {
      return res.status(404).json({ message: "No account found with this email. Try creating an account!" });
    }
    const passwordIsValid = bcrypt.compareSync(password, user.password);
    if (!passwordIsValid) {
      return res.status(401).json({ message: "Incorrect password. Please try again." });
    }

    console.log(user);
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
      expiresIn: "24h",
    });
    res.json({ token });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ message: "We're having trouble logging you in. Please try again later." });
  }
});

export default router;
