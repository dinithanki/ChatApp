import jwt from "jsonwebtoken";
export const generateToken = (userId, res) => {
    const token = jwt.sign({userId},process.env.JWT_SECRET, {
        expiresIn: '7d'
    });
    res.cookie("jwt",token,{
        maxAge: 7*24*60*60*1000, //7 days
        httpOnly: true, //prevent client side js from accessing the cookie
        sameSite:"strict",//CSFR attacks cross site request forgery
        secure: process.env.NODE_ENV !== "development" //only send cookie over https in production
    });

    return token;
};