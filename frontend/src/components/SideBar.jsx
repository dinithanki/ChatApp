import { useEffect, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import SidebarSkeleton from "./skeletons/SidebarSkeleton";
import { Users, MessageCircle } from "lucide-react";

const formatTime = (date) => {
  const now = new Date();
  const msgDate = new Date(date);
  const diffMs = now - msgDate;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "now";
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;

  return msgDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
};

const Sidebar = () => {
  const {
    selectedUser,
    setSelectedUser,
    getUsers,
    users = [],
    isUsersLoading,
  } = useChatStore();

  const { authUser, onlineUsers } = useAuthStore();
  const [showOnlineOnly, setShowOnlineOnly] = useState(false);

  useEffect(() => {
    getUsers();
  }, [getUsers]);

  const displayList = users.filter((user) => user._id !== authUser?._id);
  const isLoading = isUsersLoading;

  const filteredList = showOnlineOnly
    ? displayList.filter((item) => {
        const userId = item.otherUser?._id || item._id;
        return onlineUsers.includes(userId);
      })
    : displayList;

  if (isLoading) return <SidebarSkeleton />;

  return (
    <aside className="h-full w-20 lg:w-72 border-r border-base-300 flex flex-col transition-all duration-200">
      <div className="border-b border-base-300 w-full p-5">
        <div className="flex items-center gap-2">
          <MessageCircle className="size-6" />
          <span className="font-medium hidden lg:block">Messages</span>
        </div>
        {/* Online filter toggle */}
        <div className="mt-3 hidden lg:flex items-center gap-2">
          <label className="cursor-pointer flex items-center gap-2">
            <input
              type="checkbox"
              checked={showOnlineOnly}
              onChange={(e) => setShowOnlineOnly(e.target.checked)}
              className="checkbox checkbox-sm"
            />
            <span className="text-sm">Show online only</span>
          </label>
          <span className="text-xs text-zinc-500">
            ({onlineUsers.length - 1} online)
          </span>
        </div>
      </div>

      <div className="overflow-y-auto w-full py-3">
        {filteredList.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-zinc-500 text-sm">
            <Users className="size-8 mb-2 opacity-50" />
            <span className="hidden lg:inline">No users found</span>
          </div>
        ) : (
          filteredList.map((item) => {
            const user = item;
            const userId = user?._id;

            return (
              <button
                key={userId}
                onClick={() => setSelectedUser(user)}
                className={`
                  w-full p-3 flex items-center gap-3
                  hover:bg-base-300 transition-colors
                  border-b border-base-200/50
                  ${selectedUser?._id === userId ? "bg-base-300 ring-1 ring-base-300" : ""}
                `}
              >
                {/* Avatar */}
                <div className="relative mx-auto lg:mx-0 flex-shrink-0">
                  <img
                    src={user?.profilePic || "/avatar.png"}
                    alt={user?.fullName}
                    className="size-12 object-cover rounded-full"
                  />
                  {onlineUsers.includes(userId) && (
                    <span
                      className="absolute bottom-0 right-0 size-3 bg-green-500 
                      rounded-full ring-2 ring-zinc-900"
                    />
                  )}
                </div>

                {/* User info - only visible on larger screens */}
                <div className="hidden lg:flex flex-1 flex-col min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-medium truncate">{user?.fullName}</div>
                  </div>
                  <div className="text-sm text-zinc-500">
                    {onlineUsers.includes(userId) ? "Online" : "Offline"}
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
