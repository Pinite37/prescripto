import express from 'express'
import cors from 'cors'
import 'dotenv/config'
import connectDb from './config/mongodb.js'
import connectCloudinary from './config/cloudinary.js'
import adminRouter from './routes/adminRoute.js'
import doctorRouter from './routes/doctorRoute.js'
import userRouter from './routes/userRoute.js'


// app config 
const app = express()
const port = process.env.PORT || 4000

connectDb()
connectCloudinary()


// middleware
app.use(express.json())
app.use(cors())

// api endpoints 
app.get('/', (req, res) => {
    res.send('Hello World!')
})

app.use('/api/admin', adminRouter)
app.use('/api/doctor', doctorRouter)
app.use('/api/user', userRouter)


app.listen(port, () => {
    console.log(`Server is running on port http://localhost:${port}`)
})