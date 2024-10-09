import jwt from "jsonwebtoken"


// user authentication middleware
export const authUser = async (req, res, next) => {
    try {
        const { token } = req.headers
        if (!token) {
            return res.status(401).json({ success: false, message: "Unauthorized" })
        }
        const token_decoded = jwt.verify(token, process.env.JWT_SECRET)

        req.body.userId = token_decoded.id 
         
        next()
        
    } catch (error) { 
        
        if(error.name === "TokenExpiredError") {
            return res.status(401).json({ success: false, message: "Your session has expired, please login again" })
        } else {
            console.log(error)
            return res.status(500).json({ success: false, message: "Something went wrong" })
        }
    }
}

export default authUser