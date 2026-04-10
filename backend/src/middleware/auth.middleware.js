import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';
import cookies from 'cookie-parser';

export const protectRoute = async (req, res, next) => {
    try{
        const token = req.cookies.token;
        if(!token){
            return res.status(401).json({message:"Unauthorized- No token provided"});
        }
    }
    catch(error){}
};