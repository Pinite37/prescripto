import doctorModel from "../models/doctorModel.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import appointmentModel from "../models/appointmentModel.js";

const changeAvailability = async (req, res) => {
    try {
        const { docId } = req.body;

        const docData = await doctorModel.findById(docId)

        await doctorModel.findByIdAndUpdate(docId, { available: !docData.available })

        res.status(200).json({ success: true, message: "Availability changed successfully" })

        
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: error.message });
        
    }
}

const doctorList = async (req, res) => {
    try {
        const doctors = await doctorModel.find({}).select(["-password", "-email"]) 

        res.status(200).json({ success: true, doctors })

    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: error.message });

    }
}

// API for doctor login

const loginDoctor = async (req, res) => {
    try {
        const { email, password } = req.body;

        const doctor = await doctorModel.findOne({ email })

        if (!doctor) {
            return res.status(404).json({ success: false, message: "Doctor not found" })
        }

        const isMatch = await bcrypt.compare(password, doctor.password);

        if (!isMatch) {
            return res.status(400).json({ success: false, message: "Invalid credentials, verify email and password" })
        }

        const token = jwt.sign({ id: doctor._id }, process.env.JWT_SECRET, { expiresIn: "1d" })

        res.status(200).json({ success: true, message: "Doctor logged in successfully", token, doctor }) 

    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: error.message });

    }
} 


// API to get doctor appointments for doctor panel
 
 const appointmentsDoctor = async (req, res) => {
    try {
        const { docId } = req.body;

        const appointments = await appointmentModel.find({ docId }).sort({ createdAt: -1 })

        res.status(200).json({ success: true, appointments })

    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: error.message });

    }
} 

export { changeAvailability, doctorList, loginDoctor, appointmentsDoctor }