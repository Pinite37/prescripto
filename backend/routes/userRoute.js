import express from "express";
import { registerUser, loginUser, getProfile, updateUserProfile, bookAppointment, listAppointments } from "../controllers/userController.js";
import authUser from "../middlewares/authUser.js";
import upload from '../middlewares/multer.js'

const userRouter = express.Router();

userRouter.post('/register', registerUser)
userRouter.post('/login', loginUser)
userRouter.get('/profile', authUser, getProfile )
userRouter.post('/update', upload.single('image'),  authUser, updateUserProfile )
userRouter.post('/book-appointment', authUser, bookAppointment)
userRouter.get('/appointments', authUser, listAppointments)

export default userRouter 