import validator from 'validator'
import bcrypt from 'bcryptjs'
import { v2 as cloudinary } from 'cloudinary'
import doctorModel from '../models/doctorModel.js'
import jwt from 'jsonwebtoken'


// API for addind doctor 

const addDoctor = async (req, res) => {
    try {
        const { name, email, password, speciality, degree, experience, about, fees, address } = req.body

        const imageFile = req.file

        // check if all fields are present
        if (!name || !email || !password || !speciality || !degree || !experience || !about || !fees || !address || !imageFile) {
            return res.status(400).json({ success: false, message: "All fields are required" })
        } 

        // validating email format 
        if (!validator.isEmail(email)) {
            return res.status(400).json({ success: false, message: "Invalid email format" })
        } 

        // check if doctor already exists
        const doctor = await doctorModel.findOne({ email })
        if (doctor) {
            return res.status(400).json({ success: false, message: "Doctor already exists" })
        }

        // validating strong password
        if(password.lenght < 8) {
            return res.status(400).json({ success: false, message: "Password must be at least 8 characters long" })
        }

        // hashing password
        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(password, salt)

        // upload image to cloudinary
        const imageUpload = await cloudinary.uploader.upload(imageFile.path, {resource_type: "image"})
        
        const imageUrl = imageUpload.secure_url

        const doctorData = {
            name,
            email,
            image: imageUrl,
            password: hashedPassword,
            speciality,
            degree,
            experience,
            about,
            fees,
            address: JSON.parse(address),
            date: Date.now()
        }

        const newDoctor = new doctorModel(doctorData)
        await newDoctor.save()

        res.status(200).json({ success: true, message: "Doctor added successfully" })
        
    } catch (error) {
        console.log(error)
        res.status(500).json({ success: false, message: error.message })
    }
}

// API for login admin

const loginAdmin = async (req, res) => {
    try {
        const { email, password } = req.body

        if(email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
            const token = jwt.sign(email+password, process.env.JWT_SECRET)

            res.json({ success: true, message: "Login successful", token })

        } else {
            res.json({ success: false, message: "Invalid credentials" })
        }

    } catch (error) {
        console.log(error)
        res.status(500).json({ success: false, message: error.message })
    }
} 


export { addDoctor, loginAdmin }