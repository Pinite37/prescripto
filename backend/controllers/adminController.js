import validator from 'validator'
import bcrypt from 'bcryptjs'
import { v2 as cloudinary } from 'cloudinary'
import doctorModel from '../models/doctorModel.js'
import jwt from 'jsonwebtoken'
import appointmentModel from '../models/appointmentModel.js'
import userModel from '../models/userModel.js'


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

// API to get all the doctors for admin panel

const allDoctors = async (req, res) => {
    try {
        const doctors = await doctorModel.find({}).select("-password")
        res.status(200).json({ success: true, doctors })
    } catch (error) {
        console.log(error)
        res.status(500).json({ success: false, message: error.message })
    }
}  

// API to get all appointment list

const appointmentsAdmin = async (req, res) => {
    try {
        const appointments = await appointmentModel .find({})
        res.status(200).json({ success: true, appointments })
        
    } catch (error) {
        console.log(error)
        res.status(500).json({ success: false, message: error.message })
    }
}


// API to remove doctor

const removeDoctor = async (req, res) => {
    try {
        const { id } = req.body
        await doctorModel.findByIdAndDelete(id)
        res.status(200).json({ success: true, message: "Doctor removed successfully" })
    } catch (error) {
        console.log(error)
        res.status(500).json({ success: false, message: error.message })
    }
}

// API for appointment cancelation
const appointmentCancel = async (req, res) => {
    try {
        const { appointmentId } = req.body
        const appointmentData = await appointmentModel.findById(appointmentId)


        await appointmentModel.findByIdAndUpdate(appointmentId, { cancelled: true })

        // releasind doctors list
        const { docId, slotDate, slotTime } = appointmentData

        const doctorData = await doctorModel.findById(docId) 

        let slots_booked = doctorData.slots_booked

        slots_booked[slotDate] = slots_booked[slotDate].filter(e => e !== slotTime)

        await doctorModel.findByIdAndUpdate(docId, { slots_booked }) 
        res.status(200).json({ success: true, message: "Appointment canceled successfully" })
    } catch (error) {
        console.log(error)
        res.status(500).json({ success: false, message: error.message })
    }
 }


 // API to get dashboard data for adùin panel

 const adminDashboard = async (req, res) => {
    try {
        const doctors = await doctorModel.find({})
        const users = await userModel.find({})

        const appointments = await appointmentModel.find({})

        const dashData = {
            doctors: doctors.length,
            patients: users.length,
            appointments: appointments.length,
            latestAppointments: appointments.reverse().slice(0, 5)
        }

        res.status(200).json({ success: true, dashData })

    } catch (error) {
        console.log(error)
        res.status(500).json({ success: false, message: error.message })
    }
 }



export { addDoctor, loginAdmin, allDoctors, appointmentsAdmin, removeDoctor, appointmentCancel, adminDashboard }