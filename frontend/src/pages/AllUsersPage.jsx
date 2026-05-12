import { useEffect } from "react";
import { Loader, Send, Unlock } from "lucide-react";
import { useChatStore } from "../store/useChatStore.js";
import { useFriendsStore } from "../store/useFriendsStore.js";
import { useAuthStore } from "../store/useAuthStore.js";

const getStatusForUser = (
  userId,
  { contacts, sentRequests, pendingRequests, blockedUsers },
) => {
  const isBlocked = blockedUsers.some(
    (user) => String(user._id) === String(userId),
  );
  if (isBlocked) {
    return { label: "Unblock", type: "unblock", disabled: false };
  }

  const isFriend = contacts.some(
    (contact) => String(contact._id) === String(userId),
  );
  if (isFriend) {
    return { label: "Friends", type: "friends", disabled: true };
  }

  const sent = sentRequests.find(
    (request) =>
      String(request.receiverId?._id || request.receiverId) === String(userId),
  );
  if (sent) {
    return { label: "Waiting for accept", type: "waiting", disabled: true };
  }

  const received = pendingRequests.find(
    (request) =>
      String(request.senderId?._id || request.senderId) === String(userId),
  );
  if (received) {
    return { label: "Request received", type: "received", disabled: true };
  }

  return { label: "Send Request", type: "send", disabled: false };
};

const AllUsersPage = () => {
  const { users, getUsers, isUsersLoading } = useChatStore();
  const { authUser } = useAuthStore();
  const {
    contacts,
    blockedUsers,
    sentRequests,
    pendingRequests,
    loadFriendData,
    sendFriendRequest,
    unblockContact,
  } = useFriendsStore();

  useEffect(() => {
    getUsers();
    loadFriendData();
  }, [getUsers, loadFriendData]);

  if (isUsersLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader className="size-10 animate-spin" />
      </div>
    );
  }

  const visibleUsers = users.filter(
    (user) => String(user._id) !== String(authUser?._id),
  );

  return (
    <div className="min-h-screen bg-base-200 pt-20 px-4 pb-10">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">All Users</h1>
          <p className="text-zinc-500 mt-1">
            Send friend requests and grow your network.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visibleUsers.map((user) => {
            const status = getStatusForUser(user._id, {
              contacts,
              sentRequests,
              pendingRequests,
              blockedUsers,
            });

            return (
              <div
                key={user._id}
                className="card bg-base-100 shadow-sm border border-base-300"
              >
                <div className="card-body p-5 items-center text-center">
                  <div className="avatar mb-2">
                    <div className="w-20 rounded-full">
                      <img
                        src={user.profilePic || "/avatar.png"}
                        alt={user.fullName}
                      />
                    </div>
                  </div>

                  <h2 className="card-title text-lg justify-center">
                    {user.fullName}
                  </h2>
                  <p className="text-sm text-zinc-500">{user.email}</p>

                  <button
                    className="btn btn-primary btn-sm mt-4 gap-2 w-full"
                    disabled={status.disabled}
                    onClick={() => {
                      if (status.type === "unblock") {
                        unblockContact(user._id);
                      } else {
                        sendFriendRequest(user._id);
                      }
                    }}
                  >
                    {status.type === "unblock" ? (
                      <Unlock className="size-4" />
                    ) : (
                      <Send className="size-4" />
                    )}
                    {status.label}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AllUsersPage;
