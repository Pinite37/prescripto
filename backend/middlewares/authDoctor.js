import jwt from "jsonwebtoken"


// doctor  authentication middleware
export const authDoctor = async (req, res, next) => {
    try {
        const { dtoken } = req.headers
        if (!dtoken) {
            return res.status(401).json({ success: false, message: "Unauthorized" })
        }
        const token_decoded = jwt.verify(dtoken , process.env.JWT_SECRET)

        req.body.docId = token_decoded.id 
         
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

export default authDoctor 