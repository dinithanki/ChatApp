import { useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { Camera, Mail, User, Edit2, Check, X, MessageSquare } from "lucide-react";

const ProfilePage = () => {
  const { authUser, isUpdatingProfile, updateProfile } = useAuthStore();
  const [selectedImg, setSelectedImg] = useState(null);

  const [isEditingName, setIsEditingName] = useState(false);
  const [editName, setEditName] = useState("");
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [editBio, setEditBio] = useState("");

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.readAsDataURL(file);

    reader.onload = async () => {
      const base64Image = reader.result;
      setSelectedImg(base64Image);
      await updateProfile({ profilePic: base64Image });
    };
  };

  const handleSaveName = async () => {
    if (editName.trim() && editName.trim() !== authUser.fullName) {
      await updateProfile({ fullName: editName.trim() });
    }
    setIsEditingName(false);
  };

  const handleSaveBio = async () => {
    const defaultBio = "Hey there 👋 I’m using Chat Mania to connect, chat, and make new friends.";
    const currentBio = authUser.bio || defaultBio;
    if (editBio.trim() !== currentBio) {
      await updateProfile({ bio: editBio.trim() });
    }
    setIsEditingBio(false);
  };

  return (
    <div className="min-h-screen pt-20 pb-4">
      <div className="max-w-2xl mx-auto p-4 py-2">
        <div className="bg-base-300 rounded-xl p-6 space-y-5">
          <div className="text-center">
            <h1 className="text-2xl font-semibold ">Profile</h1>
            <p className="mt-2">Your profile information</p>
          </div>

          {/* avatar upload section */}

          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <img
                src={selectedImg || authUser.profilePic || "/avatar.png"}
                alt="Profile"
                className="size-32 rounded-full object-cover border-4 "
              />
              <label
                htmlFor="avatar-upload"
                className={`
                  absolute bottom-0 right-0 
                  bg-base-content hover:scale-105
                  p-2 rounded-full cursor-pointer 
                  transition-all duration-200
                  ${isUpdatingProfile ? "animate-pulse pointer-events-none" : ""}
                `}
              >
                <Camera className="w-5 h-5 text-base-200" />
                <input
                  type="file"
                  id="avatar-upload"
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={isUpdatingProfile}
                />
              </label>
            </div>
            <p className="text-sm text-zinc-400">
              {isUpdatingProfile
                ? "Uploading..."
                : "Click the camera icon to update your photo"}
            </p>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <div className="text-sm text-zinc-400 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Full Name
                  </div>
                  {!isEditingName ? (
                    <button onClick={() => { setIsEditingName(true); setEditName(authUser?.fullName || ""); }} className="p-1 hover:text-primary transition-colors">
                      <Edit2 className="w-4 h-4" />
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button onClick={handleSaveName} disabled={isUpdatingProfile} className="p-1 text-green-500 hover:bg-green-500/10 rounded transition-colors">
                        <Check className="w-4 h-4" />
                      </button>
                      <button onClick={() => setIsEditingName(false)} disabled={isUpdatingProfile} className="p-1 text-red-500 hover:bg-red-500/10 rounded transition-colors">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
                {isEditingName ? (
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-4 py-2 bg-base-200 rounded-lg border border-zinc-600 focus:outline-none focus:border-primary"
                    autoFocus
                  />
                ) : (
                  <p className="px-4 py-2 bg-base-200 rounded-lg border border-transparent truncate">
                    {authUser?.fullName}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <div className="text-sm text-zinc-400 flex items-center gap-2 h-7">
                  <Mail className="w-4 h-4" />
                  Email Address
                </div>
                <p className="px-4 py-2 bg-base-200 rounded-lg border border-transparent truncate">
                  {authUser?.email}
                </p>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="text-sm text-zinc-400 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Bio
                </div>
                {!isEditingBio ? (
                  <button onClick={() => { setIsEditingBio(true); setEditBio(authUser?.bio || "Hey there 👋 I’m using Chat Mania to connect, chat, and make new friends."); }} className="p-1 hover:text-primary transition-colors">
                    <Edit2 className="w-4 h-4" />
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <button onClick={handleSaveBio} disabled={isUpdatingProfile} className="p-1 text-green-500 hover:bg-green-500/10 rounded transition-colors">
                      <Check className="w-4 h-4" />
                    </button>
                    <button onClick={() => setIsEditingBio(false)} disabled={isUpdatingProfile} className="p-1 text-red-500 hover:bg-red-500/10 rounded transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
              {isEditingBio ? (
                <textarea
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  className="w-full px-4 py-2 bg-base-200 rounded-lg border border-zinc-600 focus:outline-none focus:border-primary resize-none h-16"
                  autoFocus
                />
              ) : (
                <p className="px-4 py-2 bg-base-200 rounded-lg border border-transparent min-h-[40px] whitespace-pre-wrap text-sm">
                  {authUser?.bio || "Hey there 👋 I’m using Chat Mania to connect, chat, and make new friends."}
                </p>
              )}
            </div>
          </div>

          <div className="bg-base-200 rounded-xl p-4">
            <h2 className="text-lg font-medium mb-3">Account Information</h2>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between py-1 border-b border-zinc-700">
                <span>Member Since</span>
                <span>{authUser.createdAt?.split("T")[0]}</span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span>Account Status</span>
                <span className="text-green-500">Active</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default ProfilePage;
