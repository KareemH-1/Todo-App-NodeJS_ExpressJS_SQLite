import express from "express";
import db from "../db.js";

const router = express.Router();

router.get("/", (req, res) => {
    try {
        const getTodos = db.prepare('SELECT * FROM todo WHERE user_id = ?');
        const todos = getTodos.all(req.user_id);
        res.json(todos);
    } catch (error) {
        console.error('Error fetching todos:', error);
        res.status(500).json({ message: "Failed to fetch todos" });
    }
});

router.post("/", (req, res) => {
    const { task } = req.body;
    
    if (!task || task.trim() === '') {
        return res.status(400).json({ message: "Task cannot be empty" });
    }

    try {
        const insertTodo = db.prepare('INSERT INTO todo (user_id, task, completed) VALUES (?, ?, ?)');
        const result = insertTodo.run(req.user_id, task.trim(), 0);
        
        const getTodo = db.prepare('SELECT * FROM todo WHERE id = ?');
        const newTodo = getTodo.get(result.lastInsertRowid);
        
        res.status(201).json(newTodo);
    } catch (error) {
        console.error('Error creating todo:', error);
        res.status(500).json({ message: "Failed to create todo" });
    }
});

router.put("/:id", (req, res) => {
    const { id } = req.params;
    const { task, completed } = req.body;

    try {
        const updateTodo = db.prepare('UPDATE todo SET task = ?, completed = ? WHERE id = ? AND user_id = ?');
        const result = updateTodo.run(task, completed, id, req.user_id);
        
        if (result.changes === 0) {
            return res.status(404).json({ message: "Todo not found" });
        }
        
        const getTodo = db.prepare('SELECT * FROM todo WHERE id = ?');
        const updatedTodo = getTodo.get(id);
        
        res.json(updatedTodo);
    } catch (error) {
        console.error('Error updating todo:', error);
        res.status(500).json({ message: "Failed to update todo" });
    }
});

router.delete("/:id", (req, res) => {
    const { id } = req.params;

    try {
        const deleteTodo = db.prepare('DELETE FROM todo WHERE id = ? AND user_id = ?');
        const result = deleteTodo.run(id, req.user_id);
        
        if (result.changes === 0) {
            return res.status(404).json({ message: "Todo not found" });
        }
        
        res.json({ message: "Todo deleted successfully" });
    } catch (error) {
        console.error('Error deleting todo:', error);
        res.status(500).json({ message: "Failed to delete todo" });
    }
});

export default router;