import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import {
  LogOut,
  MessageSquareDot,
  Settings,
  CircleUser,
  Users,
  Search,
  Menu,
} from "lucide-react";
import RequestsNotification from "./RequestsNotification";

const Navbar = () => {
  const { logout, authUser } = useAuthStore();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const navigate = useNavigate();

  const handleLogoutConfirm = async () => {
    setShowLogoutConfirm(false);
    await logout();
    navigate("/login");
  };

  return (
    <>
      <header className="border-b border-base-300 fixed w-full top-0 z-40 backdrop-blur-lg bg-base-100/80">
        <div className="container mx-auto px-4 h-16">
          <div className="flex items-center justify-between h-full">
            <div className="flex items-center gap-8">
              <Link
                to="/"
                className="flex items-center gap-2.5 hover:opacity-80 transition-all"
              >
                <div className="size-9 rounded-lg bg-primary/10 flex items-center justify-center">
                  <MessageSquareDot className="w-5 h-5 text-primary" />
                </div>
                <h1 className="text-lg font-bold">Chat Mania</h1>
              </Link>
            </div>

            <div className="flex items-center gap-2">
              {authUser && (
                <>
                  {/* Mobile Menu Dropdown */}
                  <div className="dropdown dropdown-end md:hidden">
                    <div tabIndex={0} role="button" className="btn btn-sm btn-ghost">
                      <Menu className="w-5 h-5" />
                    </div>
                    <ul tabIndex={0} className="dropdown-content menu bg-base-100 rounded-box z-[50] w-52 p-2 shadow border border-base-300 mt-4 space-y-1">
                      <li>
                        <Link to="/users" className="gap-3">
                          <Search className="w-4 h-4" />
                          All Users
                        </Link>
                      </li>
                      <li>
                        <Link to="/contacts" className="gap-3">
                          <Users className="w-4 h-4" />
                          Contacts
                        </Link>
                      </li>
                      <li>
                        <Link to="/profile" className="gap-3">
                          <CircleUser className="w-4 h-4" />
                          Profile
                        </Link>
                      </li>
                      <li>
                        <Link to="/settings" className="gap-3">
                          <Settings className="w-4 h-4" />
                          Settings
                        </Link>
                      </li>
                      <li className="!p-0 mt-1">
                        <RequestsNotification />
                      </li>
                      <li className="mt-2 border-t border-base-300 pt-2">
                        <button onClick={() => setShowLogoutConfirm(true)} className="text-error gap-3">
                          <LogOut className="w-4 h-4" />
                          Logout
                        </button>
                      </li>
                    </ul>
                  </div>

                  {/* Desktop Menu */}
                  <div className="hidden md:flex items-center gap-2">
                    <Link
                      to="/users"
                      className="btn btn-sm gap-2 transition-colors"
                    >
                      <Search className="w-4 h-4" />
                      <span>All Users</span>
                    </Link>

                    <Link
                      to="/contacts"
                      className="btn btn-sm gap-2 transition-colors"
                    >
                      <Users className="w-4 h-4" />
                      <span>Contacts</span>
                    </Link>

                    <Link to="/profile" className="btn btn-sm gap-2">
                      <CircleUser className="size-5" />
                      <span>Profile</span>
                    </Link>

                    <Link
                      to="/settings"
                      className="btn btn-sm gap-2 transition-colors"
                    >
                      <Settings className="w-4 h-4" />
                      <span>Settings</span>
                    </Link>

                    <RequestsNotification />

                    <button
                      className="flex gap-2 items-center btn btn-sm btn-ghost hover:bg-error/10 hover:text-error transition-colors"
                      onClick={() => setShowLogoutConfirm(true)}
                    >
                      <LogOut className="size-5" />
                      <span className="hidden lg:inline">Logout</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-base-300/60 backdrop-blur-sm"
            onClick={() => setShowLogoutConfirm(false)}
          ></div>

          {/* Modal Content */}
          <div className="relative bg-base-100 border border-base-300 shadow-2xl rounded-2xl w-full max-w-sm overflow-hidden flex flex-col">
            <div className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="bg-error/10 text-error p-3 rounded-full flex-shrink-0">
                  <LogOut className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-xl text-base-content">Confirm Logout</h3>
              </div>
              <p className="text-base-content/70 leading-relaxed">
                Are you sure you want to log out?
              </p>
            </div>
            <div className="bg-base-200/50 px-6 py-4 flex items-center justify-end gap-3 border-t border-base-300">
              <button
                className="btn btn-ghost hover:bg-base-300/50 font-medium"
                onClick={() => setShowLogoutConfirm(false)}
              >
                Cancel
              </button>
              <button
                className="btn btn-error text-white font-medium"
                onClick={handleLogoutConfirm}
              >
                Yes, Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
