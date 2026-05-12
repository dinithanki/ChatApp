import { useEffect, useState } from "react";
import { Loader, MessageCircle, Trash2, Ban, Unlock } from "lucide-react";
import { useFriendsStore } from "../store/useFriendsStore.js";
import { useAuthStore } from "../store/useAuthStore.js";

const Tabs = {
  CONTACTS: "contacts",
  ONLINE: "online",
  BLOCKED: "blocked",
};

const ContactsPage = () => {
  const {
    contacts,
    blockedUsers,
    loadFriendData,
    isLoading,
    deleteContact,
    blockContact,
    unblockContact,
  } = useFriendsStore();
  const [active, setActive] = useState(Tabs.CONTACTS);
  const { onlineUsers } = useAuthStore();

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

  const onlineContactList = contacts.filter((c) =>
    onlineUsers?.some((id) => String(id) === String(c._id)),
  );

  const contactsCount = contacts?.length || 0;
  const onlineCount = onlineContactList?.length || 0;
  const blockedCount = blockedUsers?.length || 0;

  const renderList = (list, type) => {
    if (!list || list.length === 0) {
      return (
        <div className="bg-base-100 rounded-box border border-base-300 p-10 text-center text-zinc-500">
          <MessageCircle className="size-10 mx-auto mb-3 opacity-60" />
          {type === Tabs.BLOCKED ? "No blocked users." : "No users found."}
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {list.map((contact) => (
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
            <div className="flex gap-2">
              {type === Tabs.CONTACTS && (
                <>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => {
                      if (confirm(`Delete contact ${contact.fullName}?`)) {
                        deleteContact(contact._id);
                      }
                    }}
                    title="Delete contact"
                  >
                    <Trash2 className="size-4" />
                  </button>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => {
                      if (confirm(`Block contact ${contact.fullName}?`)) {
                        blockContact(contact._id);
                      }
                    }}
                    title="Block contact"
                  >
                    <Ban className="size-4" />
                  </button>
                </>
              )}

              {type === Tabs.BLOCKED && (
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => {
                    if (confirm(`Unblock ${contact.fullName}?`)) {
                      unblockContact(contact._id);
                    }
                  }}
                  title="Unblock user"
                >
                  <Unlock className="size-4" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-base-200 pt-20 px-4 pb-10">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Contacts</h1>

        <div className="tabs tabs-boxed mb-6">
          <button
            className={`tab ${active === Tabs.CONTACTS ? "tab-active" : ""}`}
            onClick={() => setActive(Tabs.CONTACTS)}
          >
            Contacts ({contactsCount})
          </button>
          <button
            className={`tab ${active === Tabs.ONLINE ? "tab-active" : ""}`}
            onClick={() => setActive(Tabs.ONLINE)}
          >
            Online ({onlineCount})
          </button>
          <button
            className={`tab ${active === Tabs.BLOCKED ? "tab-active" : ""}`}
            onClick={() => setActive(Tabs.BLOCKED)}
          >
            Blocked ({blockedCount})
          </button>
        </div>

        {active === Tabs.CONTACTS && renderList(contacts, Tabs.CONTACTS)}
        {active === Tabs.ONLINE && renderList(onlineContactList, Tabs.ONLINE)}
        {active === Tabs.BLOCKED && renderList(blockedUsers, Tabs.BLOCKED)}
      </div>
    </div>
  );
};

export default ContactsPage;
