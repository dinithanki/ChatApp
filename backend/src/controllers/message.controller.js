import User from '../models/user.model.js';
import Message from '../models/message.model.js';

export const getUsersForSidebar = async (req, res) => {
    try{
        const loggedInUserId = req.user.id;
        const filterUsers = await User.find({_id: {$ne: loggedInUserId}}).select("-password");
        res.status(200).json(filterUsers);
    }
    catch(err){
        console.error("Error in getUsersForSidebar:", err);
        res.status(500).json({ error: "Internal server error" });
    }
};
export const getMessages = async (req, res) => {
    try{
        const {id:userToChatId}= req.params;
        const myId = req.user.id;

        const messages = await Message.find({
            $or:[
                {sender: myId, receiver: userToChatId},
                {sender: userToChatId, receiver: myId}
            ]
        })

        res.status(200).json(messages);
    }
    catch(err){
        console.error("Error in getMessages:", err);
        res.status(500).json({ error: "Internal server error" });
    }
}
;
export const sendMessage = async (req, res) => {
    try{
        const{text,image}= req.body;
        const {id:userToChatId}= req.params;
        const senderId = req.user._id;

        let imageUrl;
        if(image){
            //upload base64 image to cloudinary
            const uploadResponse = await cloudinary.uploader.upload(image);
            imageUrl = uploadResponse.secure_url;
        }

        const newMessage = new Message({
            senderId,
            userToChatId,
            text,
            image: imageUrl
        });
         await newMessage.save();
         //to do:realtime fncctionaliyies goes here using socket.io
        res.status(201).json(newMessage);
    }
    catch(err){
        console.error("Error in sendMessage:", err);
        res.status(500).json({ error: "Internal server error" });
    }
};