import express from 'express';
import UserController from '../controllers/UserController.js';

const router = express.Router();


// router.post('/register', UserController.register);
// router.post('/login', UserController.login);


// Use the methods directly since UserController is already an instance
router.post('/register', (req, res) => UserController.register(req, res));
router.post('/login', (req, res) => UserController.login(req, res));

export default router;
