import validator from 'validator'
import bcryptjs from 'bcryptjs'
import userModel from '../models/userModel.js'
import jwt from 'jsonwebtoken'

// API to register user

const registerUser = async (req, res) => {
    try {
        const { name, email, password } = req.body
        if(!name || !email || !password) {
            return res.status(400).json({ success: false, message: "Please enter all fields" })
        } 

        if(!validator.isEmail(email)) {
            return res.status(400).json({ success: false, message: "Please enter a valid email" })
        } 

        if(password.lenght < 8) {
            return res.status(400).json({ success: false, message: "Password must be at least 8 characters" })
        }

        // hashing user password 
        const salt = await bcryptjs.genSalt(10)
        const hashedPassword = await bcryptjs.hash(password, salt)

        const userData = {
            name,
            email,
            password: hashedPassword
        }

        const newUser = new userModel(userData)
        const user = await newUser.save()


        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET_KEY, { expiresIn: '1d' })

        res.status(201).json({ success: true, message: "User registered successfully" , token })
    } catch (error) {
        console.log(error)
        res.status(500).json({ success: false, message: error.message })
    }
}