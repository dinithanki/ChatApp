import { generateToken } from '../lib/utils.js';
import User from '../models/user.model.js';
import bcrypt from 'bcryptjs';

export const signup = async (req, res) => {
    const {fullName, email, password} = req.body;
    try{
        if(!fullName || !email || !password){
            return res.status(400).json({message:"Please fill all the fields"});
        }
        //hash the password
        if(password.length < 6){
            return res.status(400).json({message:"Password must be at least 6 characters long"});
        }
        const user = await User.findOne({email});

        if(user) return res.status(400).json({message:"User already exists"});

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({
            fullName,
            email,
            password: hashedPassword,
        })
        if(newUser){
            //generate JWT token here
            const token = generateToken(newUser._id, res);
            await newUser.save();

            res.status(201).json({
                _id: newUser._id,
                fullName: newUser.fullName,
                email: newUser.email,
                profilePic: newUser.profilePic,
            });

        } else{
            res.status(400).json({message:"Error creating user"});
        }


    } catch(error){
        console.error("Error in signup controller:", error);
        res.status(500).json({message:"Error in signup controller"});
    }
};

export const login = async (req, res) => {
    const {email, password} = req.body;
    try{
        const user = await User.findOne({email});
        if(!user){
            return res.status(400).json({message:"Invalid credentials"});
        }
        
        const isPasswordCorrect = await bcrypt.compare(password, user.password);
        if(!isPasswordCorrect){
            return res.status(400).json({message:"Invalid credentials"});
        }
        //generate JWT token here
        generateToken(user._id, res);

        res.status(200).json({
            _id: user._id,
            fullName: user.fullName,
            email: user.email,
            profilePic: user.profilePic,
        });

    }
    catch(error){
        console.error("Error in login controller:", error);
        res.status(500).json({message:"Error in login controller"});
    }
};

export const logout = (req, res) => {
    try{
        res.cookie("jwt","",{maxAge:0});
        res.status(200).json({message:"Logged out successfully"});
    }
    catch(error){
        console.error("Error in logout controller:", error);
        res.status(500).json({message:"Error in logout controller"});
    }
};
export const updateProfile = async (req, res) => {
    
};