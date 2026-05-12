import { useEffect } from "react";
import { useAuthStore } from "../store/useAuthStore.js";
import { useFriendsStore } from "../store/useFriendsStore.js";

const FriendBootstrap = () => {
  const { authUser, socket } = useAuthStore();
  const {
    loadFriendData,
    handleFriendRequestReceived,
    handleFriendRequestSent,
    handleFriendRequestAccepted,
    handleFriendRequestRejected,
  } = useFriendsStore();

  useEffect(() => {
    if (!authUser) return;
    loadFriendData();
  }, [authUser, loadFriendData]);

  useEffect(() => {
    if (!socket) return;

    const onReceived = (request) => handleFriendRequestReceived(request);
    const onSent = (request) => handleFriendRequestSent(request);
    const onAccepted = (request) => handleFriendRequestAccepted(request);
    const onRejected = (payload) => handleFriendRequestRejected(payload);

    socket.on("friendRequestReceived", onReceived);
    socket.on("friendRequestSent", onSent);
    socket.on("friendRequestAccepted", onAccepted);
    socket.on("friendRequestRejected", onRejected);

    return () => {
      socket.off("friendRequestReceived", onReceived);
      socket.off("friendRequestSent", onSent);
      socket.off("friendRequestAccepted", onAccepted);
      socket.off("friendRequestRejected", onRejected);
    };
  }, [
    socket,
    handleFriendRequestReceived,
    handleFriendRequestSent,
    handleFriendRequestAccepted,
    handleFriendRequestRejected,
  ]);

  return null;
};

export default FriendBootstrap;
