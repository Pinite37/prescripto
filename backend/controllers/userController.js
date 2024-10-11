import validator from 'validator'
import bcryptjs from 'bcryptjs'
import userModel from '../models/userModel.js'
import jwt from 'jsonwebtoken'
import { v2 as cloudinary } from 'cloudinary'
import doctorModel from '../models/doctorModel.js'
import appointmentModel from '../models/appointmentModel.js'
import razorpay  from 'razorpay'
import { FedaPay, Transaction } from 'fedapay'

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


        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' })

        res.status(201).json({ success: true, message: "User registered successfully" , token })
    } catch (error) {
        console.log(error)
        res.status(500).json({ success: false, message: error.message })
    }
}


// API for user login

const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body
        if(!email || !password) {
            return res.status(400).json({ success: false, message: "Please enter all fields" })
        }

        const user = await userModel.findOne({ email })
        if(!user) {
            return res.status(400).json({ success: false, message: "User not found" })
        }

        const isMatch = await bcryptjs.compare(password, user.password)
        if(!isMatch) {
            return res.status(400).json({ success: false, message: "Invalid credentials, verify email and password" })
        }

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' })

        res.status(200).json({ success: true, message: "User logged in successfully", token })
    } catch (error) {
        console.log(error)
        res.status(500).json({ success: false, message: error.message })
    }
}

// API to get user profil data

const getProfile  = async (req, res) => {
    try {
        const { userId } = req.body
        const userData = await userModel.findById(userId).select('-password')
        res.status(200).json({ success: true, userData }) 
    } catch (error) {
        console.log(error)
        res.status(500).json({ success: false, message: error.message })
    }
}


// API to update user profile

 const updateUserProfile = async (req, res) => {
    try {
        const { userId, name, phone, address, dob, gender } = req.body
        const imageFile = req.file

        if(!name || !phone  || !dob || !gender) {
            return res.status(400).json({ success: false, message: "Please enter all fields" })
        }

        await userModel.findByIdAndUpdate(userId, { name, phone, address: JSON.parse(address), dob, gender })

        if(imageFile) {
            // uploading image to cloudinary
            const imageUpload = await cloudinary.uploader.upload(imageFile.path, { resource_type: 'image' })
            const imageUrl = imageUpload.secure_url

            await userModel.findByIdAndUpdate(userId, { image: imageUrl }) 
        }

        const user = await userModel.findById(userId)
        const appointments = await appointmentModel.find({ userId })

        await Promise.all(appointments.map(async (appointment) => {
            appointment.userData = {
                _id: user._id,
                name: user.name,
                email: user.email,
                image: user.image || appointment.userData.image,
                address: user.address,
                gender: user.gender,
                dob: user.dob,
                phone: user.phone
            }
            await appointment.save()
        }))

        res.status(200).json({ success: true, message: "Profile updated successfully" }) 

         
    } catch (error) {
        console.log(error)
        res.status(500).json({ success: false, message: error.message })
    }
 }

 // API to book appointment

 const bookAppointment = async (req, res) => {
    try {
        const { userId, docId, slotDate, slotTime } = req.body

        const docData = await doctorModel.findById(docId).select("-password")

        if(!docData.available) {
            return res.status(400).json({ success: false, message: "Doctor is not available" }) 
        }

        let slots_booked = docData.slots_booked
        

        if(slots_booked[slotDate]) {
            if(slots_booked[slotDate].includes(slotTime)) {
                return res.status(400).json({ success: false, message: "Slot already booked" })
            } else {
                slots_booked[slotDate].push(slotTime)
            }
        } else {
            slots_booked[slotDate] = []
            slots_booked[slotDate].push(slotTime)
        }

        const userData = await userModel.findById(userId).select("-password")

        delete docData.slots_booked

        const appointmentData = {
            userId,
            docId,
            userData,
            docData,
            amount: docData.fees,
            slotTime,
            slotDate,
            date: Date.now()
        }

        const newAppointment = new appointmentModel(appointmentData)
        await newAppointment.save()
        await doctorModel.findByIdAndUpdate(docId, { slots_booked })
        res.status(200).json({ success: true, message: "Appointment booked successfully" })

        
         
    } catch (error) {
        console.log(error)
        res.status(500).json({ success: false, message: error.message })
    }
 }

 // API to get user appointments
 const listAppointments = async (req, res) => {
    try {
        const { userId } = req.body
        const appointments = await appointmentModel.find({ userId })
        res.status(200).json({ success: true, appointments })
    } catch (error) {
        console.log(error)
        res.status(500).json({ success: false, message: error.message })
    }
 }

 // API to cancel appointment

 const cancelAppointment = async (req, res) => {
    try {
        const { userId,  appointmentId } = req.body
        const appointmentData = await appointmentModel.findById(appointmentId)
        // verify appointment user
        if(appointmentData.userId !== userId) {
            return res.status(400).json({ success: false, message: "You are not authorized to cancel this appointment" })
        }

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

 FedaPay.setApiKey(process.env.FEDAPAY_KEY_ID);
 FedaPay.setEnvironment('sandbox');

 // API to make payment of appointment using razorpay

 const paymentFedapay = async (req, res) => {
    try {
        const { appointmentId } = req.body;
        const appointmentData = await appointmentModel.findById(appointmentId);

        if (!appointmentData || appointmentData.cancelled) {
            return res.status(400).json({ success: false, message: "Appointment not found or cancelled" });
        }

        // Créer la transaction Fedapay
        const transaction = await Transaction.create({
            description: `Payment for appointment ${appointmentId}`,
            amount: appointmentData.amount, // Assurez-vous que le montant est un entier (en centimes)
            currency: {
                iso: 'XOF' // Adapter la devise à la réalité de votre projet
            },
            callback_url: 'https://maplateforme.com/callback', // Mettre l'URL de retour correcte
            customer: {
                name: appointmentData.name,
                email: appointmentData.email,
                phone_number: {
                    number: appointmentData.phone, 
                    country: 'BJ' // Modifier selon le pays du client
                }
            }
        });

        // Générer le token et récupérer le lien de paiement
        const token = await transaction.generateToken();

        // Envoyer la réponse avec le lien de redirection vers la page de paiement
        res.status(200).json({ success: true, paymentUrl: token.url });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: error.message });
    }
};


export { registerUser, loginUser, getProfile, updateUserProfile, bookAppointment, listAppointments, cancelAppointment, paymentFedapay }