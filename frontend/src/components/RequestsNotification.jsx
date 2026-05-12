import { useState } from "react";
import { Bell, Check, X } from "lucide-react";
import { useFriendsStore } from "../store/useFriendsStore.js";

const RequestsNotification = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { pendingRequests, acceptFriendRequest, rejectFriendRequest } =
    useFriendsStore();

  return (
    <div className="relative">
      <button
        className="btn btn-ghost btn-sm relative"
        onClick={() => setIsOpen((prev) => !prev)}
      >
        <Bell className="size-5" />
        {pendingRequests.length > 0 && (
          <span className="badge badge-primary badge-sm absolute -top-1 -right-1">
            {pendingRequests.length}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 rounded-box border border-base-300 bg-base-100 shadow-xl z-50">
          <div className="p-4 border-b border-base-300">
            <h3 className="font-semibold">Friend Requests</h3>
          </div>

          <div className="max-h-96 overflow-y-auto p-2">
            {pendingRequests.length === 0 ? (
              <div className="p-4 text-sm text-zinc-500 text-center">
                No pending requests
              </div>
            ) : (
              pendingRequests.map((request) => (
                <div
                  key={request._id}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-base-200"
                >
                  <img
                    src={request.senderId?.profilePic || "/avatar.png"}
                    alt={request.senderId?.fullName}
                    className="size-10 rounded-full object-cover"
                  />

                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">
                      {request.senderId?.fullName}
                    </div>
                    <div className="text-xs text-zinc-500 truncate">
                      wants to connect
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      className="btn btn-xs btn-success btn-circle"
                      onClick={() => acceptFriendRequest(request._id)}
                    >
                      <Check className="size-4" />
                    </button>
                    <button
                      className="btn btn-xs btn-error btn-circle"
                      onClick={() => rejectFriendRequest(request._id)}
                    >
                      <X className="size-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default RequestsNotification;
