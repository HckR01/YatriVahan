import { useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  MessageCircle,
  Send,
  Users,
} from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Footer from "../../components/layout/Footer";
import Navbar from "../../components/layout/Navbar";
import { formatGroupDate, mockGroups } from "./groupData";
import { getCurrentUser, getLoginPath } from "../../utils/auth";

const GroupDetailsPage = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const group = mockGroups.find((item) => String(item.id) === groupId) || mockGroups[0];
  const [messages, setMessages] = useState(group.messages);
  const [message, setMessage] = useState("");

  const sendMessage = (event) => {
    event.preventDefault();
    if (!getCurrentUser()) {
      navigate(getLoginPath(`/groups/${groupId}`));
      return;
    }
    if (!message.trim()) {
      return;
    }
    setMessages((currentMessages) => [
      ...currentMessages,
      {
        sender: "You",
        text: message.trim(),
        time: new Intl.DateTimeFormat("en-IN", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        }).format(new Date()),
      },
    ]);
    setMessage("");
  };

  const transportState = {
    group: {
      name: group.name,
      from: group.from,
      destination: group.destination,
      travelDate: group.travelDate,
      preferredTime: group.preferredTime,
      members: group.members,
    },
  };

  return (
    <div className="min-h-screen bg-[#FFF9F3]">
      <Navbar />
      <main className="mx-auto max-w-5xl px-5 py-12 sm:px-8 md:py-16">
        <Link
          to="/groups"
          className="mb-7 inline-flex items-center gap-2 text-sm font-bold text-[#E53935] hover:underline"
        >
          <ArrowLeft size={17} />
          Back to groups
        </Link>
        <header className="rounded-3xl border border-[#EFDED9] bg-white p-6 shadow-[0_18px_44px_rgba(59,13,18,0.08)] sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.14em] text-[#E53935]">
                Travel group
              </p>
              <h1 className="mt-2 font-serif text-3xl text-[#65151B] sm:text-4xl">
                {group.name}
              </h1>
              <p className="mt-3 text-lg font-semibold text-[#171414]">
                {group.from} <span className="text-[#E53935]">→</span>{" "}
                {group.destination}
              </p>
            </div>
            <span className="inline-flex items-center gap-2 rounded-full bg-[#FFF1E8] px-4 py-2 text-sm font-bold text-[#A4491D]">
              <Users size={17} />
              {group.members}/{group.maxMembers} members
            </span>
          </div>
          <div className="mt-6 grid gap-3 border-y border-[#EFDED9] py-4 text-sm text-[#665B59] sm:grid-cols-2">
            <p className="flex items-center gap-2">
              <CalendarDays size={17} className="text-[#E53935]" />
              {formatGroupDate(group.travelDate)}
            </p>
            <p>
              <strong className="text-[#171414]">Preferred time:</strong>{" "}
              {group.preferredTime}
            </p>
          </div>
          <p className="mt-5 leading-relaxed text-[#665B59]">{group.description}</p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => navigate("/hire-ride", { state: transportState })}
              className="min-h-12 flex-1 rounded-xl bg-[#E53935] px-5 text-sm font-bold text-white transition hover:brightness-110"
            >
              Hire Rider / Driver
            </button>
            <button
              type="button"
              onClick={() =>
                navigate("/hire-ride", {
                  state: { ...transportState, bookingType: "full-cab" },
                })
              }
              className="min-h-12 flex-1 rounded-xl bg-[#FF8A3D] px-5 text-sm font-bold text-[#3B0D12] transition hover:brightness-105"
            >
              Book Full Cab
            </button>
          </div>
        </header>

        <div className="mt-6 grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
          <section className="rounded-2xl border border-[#EFDED9] bg-white p-5 shadow-[0_12px_30px_rgba(59,13,18,0.06)] sm:p-6">
            <h2 className="flex items-center gap-2 text-xl font-bold text-[#65151B]">
              <Users size={20} className="text-[#E53935]" />
              Members
            </h2>
            <ul className="mt-5 space-y-3">
              {group.memberList.map((member) => (
                <li
                  key={member}
                  className="rounded-xl bg-[#FFF9F3] px-4 py-3 text-sm font-semibold text-[#171414]"
                >
                  {member}
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-2xl border border-[#EFDED9] bg-white p-5 shadow-[0_12px_30px_rgba(59,13,18,0.06)] sm:p-6">
            <h2 className="flex items-center gap-2 text-xl font-bold text-[#65151B]">
              <MessageCircle size={20} className="text-[#E53935]" />
              Group Chat
            </h2>
            <div className="mt-5 max-h-80 space-y-3 overflow-y-auto rounded-xl bg-[#FFF9F3] p-4">
              {messages.length === 0 && (
                <p className="py-5 text-center text-sm text-[#665B59]">
                  Start the conversation for this journey.
                </p>
              )}
              {messages.map((item, index) => (
                <div key={`${item.sender}-${item.time}-${index}`} className="rounded-xl bg-white p-3">
                  <div className="flex items-center justify-between gap-3">
                    <strong className="text-sm text-[#171414]">{item.sender}</strong>
                    <span className="text-xs text-[#9A8D89]">{item.time}</span>
                  </div>
                  <p className="mt-1 text-sm leading-relaxed text-[#665B59]">{item.text}</p>
                </div>
              ))}
            </div>
            <form onSubmit={sendMessage} className="mt-4 flex gap-2">
              <label htmlFor="group-message" className="sr-only">
                Send a group message
              </label>
              <input
                id="group-message"
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                className="min-h-11 min-w-0 flex-1 rounded-xl border border-[#EFDED9] px-4 text-sm outline-none focus:border-[#E53935] focus:ring-4 focus:ring-[#E53935]/10"
                placeholder="Write a message..."
              />
              <button
                type="submit"
                className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#E53935] text-white transition hover:brightness-110"
                aria-label="Send message"
              >
                <Send size={17} />
              </button>
            </form>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default GroupDetailsPage;
