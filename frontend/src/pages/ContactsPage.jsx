import { useEffect } from "react";
import { Loader, MessageCircle } from "lucide-react";
import { useFriendsStore } from "../store/useFriendsStore.js";

const ContactsPage = () => {
  const { contacts, loadFriendData, isLoading } = useFriendsStore();

  useEffect(() => {
    loadFriendData();
  }, [loadFriendData]);

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader className="size-10 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-200 pt-20 px-4 pb-10">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Contacts</h1>

        {contacts.length === 0 ? (
          <div className="bg-base-100 rounded-box border border-base-300 p-10 text-center text-zinc-500">
            <MessageCircle className="size-10 mx-auto mb-3 opacity-60" />
            No contacts yet.
          </div>
        ) : (
          <div className="space-y-3">
            {contacts.map((contact) => (
              <div
                key={contact._id}
                className="flex items-center gap-4 bg-base-100 border border-base-300 rounded-box p-4"
              >
                <img
                  src={contact.profilePic || "/avatar.png"}
                  alt={contact.fullName}
                  className="size-12 rounded-full object-cover"
                />
                <div className="flex-1">
                  <div className="font-semibold">{contact.fullName}</div>
                  <div className="text-sm text-zinc-500">{contact.email}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ContactsPage;
