import { useState } from "react";
import { CalendarDays, MapPin, Plus, Search, Users } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import Footer from "../../components/layout/Footer";
import Navbar from "../../components/layout/Navbar";
import { formatGroupDate, mockGroups } from "./groupData";
import { getCurrentUser, getLoginPath } from "../../utils/auth";

const initialForm = {
  name: "",
  from: "",
  destination: "",
  travelDate: "",
  preferredTime: "Morning",
  maxMembers: 4,
  description: "",
};

const GroupsPage = () => {
  const [groups, setGroups] = useState(mockGroups);
  const [form, setForm] = useState(initialForm);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  const updateForm = (field, value) => {
    setForm((currentForm) => ({ ...currentForm, [field]: value }));
  };

  const handleCreateGroup = (event) => {
    event.preventDefault();
    if (!getCurrentUser()) {
      navigate(getLoginPath("/groups"));
      return;
    }
    if (
      !form.name.trim() ||
      !form.from.trim() ||
      !form.destination.trim() ||
      !form.travelDate
    ) {
      return;
    }

    const newGroup = {
      ...form,
      id: Date.now(),
      name: form.name.trim(),
      from: form.from.trim(),
      destination: form.destination.trim(),
      maxMembers: Number(form.maxMembers),
      members: 1,
      joined: true,
      description: form.description.trim(),
      memberList: ["You"],
      messages: [],
    };

    setGroups((currentGroups) => [newGroup, ...currentGroups]);
    setForm(initialForm);
    setShowCreateForm(false);
  };

  const visibleGroups = groups.filter((group) => {
    const query = searchTerm.trim().toLowerCase();
    return (
      !query ||
      group.name.toLowerCase().includes(query) ||
      group.from.toLowerCase().includes(query) ||
      group.destination.toLowerCase().includes(query)
    );
  });

  const joinGroup = (groupId) => {
    if (!getCurrentUser()) {
      navigate(getLoginPath(`/groups/${groupId}`));
      return;
    }
    setGroups((currentGroups) =>
      currentGroups.map((group) =>
        group.id === groupId && group.members < group.maxMembers
          ? {
              ...group,
              members: group.members + 1,
              joined: true,
              memberList: [...group.memberList, "You"],
            }
          : group,
      ),
    );
  };

  const inputClass =
    "min-h-12 w-full rounded-[13px] border border-[#EFDED9] bg-white px-4 text-[#171414] outline-none transition placeholder:text-[#9A8D89] focus:border-[#E53935] focus:ring-4 focus:ring-[#E53935]/10";
  const labelClass = "mb-2 block text-sm font-bold text-[#171414]";

  return (
    <div className="min-h-screen bg-[#FFF9F3]">
      <Navbar />
      <main className="mx-auto max-w-7xl px-5 py-12 sm:px-8 md:py-16">
        <header className="mb-8 text-center">
          <p className="mb-3 text-sm font-bold uppercase tracking-[0.18em] text-[#E53935]">
            Plan together
          </p>
          <h1 className="font-serif text-4xl leading-tight text-[#65151B] sm:text-5xl">
            Travel Groups
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-[#665B59] sm:text-lg">
            Find people going to the same place and plan your journey together.
          </p>
        </header>

        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={() => document.getElementById("group-search")?.focus()}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-[#E53935] px-5 text-sm font-bold text-[#E53935] transition hover:bg-[#FFF1E8]"
          >
            <Search size={18} />
            Search Groups
          </button>
          <button
            type="button"
            onClick={() => setShowCreateForm((isOpen) => !isOpen)}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#E53935] px-5 text-sm font-bold text-white shadow-md transition hover:brightness-110"
          >
            <Plus size={18} />
            Create Group
          </button>
        </div>

        {showCreateForm && (
          <form
            onSubmit={handleCreateGroup}
            className="mb-9 rounded-3xl border border-[#EFDED9] bg-white p-5 shadow-[0_18px_44px_rgba(59,13,18,0.08)] sm:p-8"
          >
            <h2 className="mb-5 text-2xl font-bold text-[#65151B]">
              Create a travel group
            </h2>
            <div className="grid gap-5 md:grid-cols-2">
              {[
                ["name", "Group Name", "e.g. Puri Group 02"],
                ["from", "From", "Starting location"],
                ["destination", "Destination", "Where are you going?"],
              ].map(([field, label, placeholder]) => (
                <div key={field}>
                  <label htmlFor={`group-${field}`} className={labelClass}>
                    {label}
                  </label>
                  <input
                    id={`group-${field}`}
                    value={form[field]}
                    onChange={(event) => updateForm(field, event.target.value)}
                    className={inputClass}
                    placeholder={placeholder}
                    required
                  />
                </div>
              ))}
              <div>
                <label htmlFor="group-date" className={labelClass}>
                  Expected Travel Date
                </label>
                <input
                  id="group-date"
                  type="date"
                  value={form.travelDate}
                  onChange={(event) => updateForm("travelDate", event.target.value)}
                  className={inputClass}
                  required
                />
              </div>
              <div>
                <label htmlFor="group-time" className={labelClass}>
                  Preferred Time
                </label>
                <select
                  id="group-time"
                  value={form.preferredTime}
                  onChange={(event) => updateForm("preferredTime", event.target.value)}
                  className={inputClass}
                >
                  <option>Morning</option>
                  <option>Afternoon</option>
                  <option>Evening</option>
                  <option>Any Time</option>
                </select>
              </div>
              <div>
                <label htmlFor="group-members" className={labelClass}>
                  Maximum Members
                </label>
                <input
                  id="group-members"
                  type="number"
                  min="2"
                  max="20"
                  value={form.maxMembers}
                  onChange={(event) => updateForm("maxMembers", event.target.value)}
                  className={inputClass}
                />
              </div>
              <div className="md:col-span-2">
                <label htmlFor="group-description" className={labelClass}>
                  Description
                </label>
                <textarea
                  id="group-description"
                  rows="3"
                  value={form.description}
                  onChange={(event) => updateForm("description", event.target.value)}
                  className={`${inputClass} py-3`}
                  placeholder="Tell travellers about your plan"
                />
              </div>
            </div>
            <button
              type="submit"
              className="mt-6 min-h-12 rounded-xl bg-[#E53935] px-6 text-sm font-bold text-white transition hover:brightness-110"
            >
              Create Group
            </button>
          </form>
        )}

        <div className="mb-6 max-w-xl">
          <label htmlFor="group-search" className="sr-only">
            Search groups
          </label>
          <div className="relative">
            <Search
              size={19}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#665B59]"
            />
            <input
              id="group-search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className={`${inputClass} pl-11`}
              placeholder="Search by group name, starting point or destination"
            />
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          {visibleGroups.map((group) => (
            <article
              key={group.id}
              className="rounded-2xl border border-[#EFDED9] bg-white p-5 shadow-[0_14px_34px_rgba(59,13,18,0.07)] sm:p-6"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold text-[#65151B]">{group.name}</h2>
                  <p className="mt-2 flex items-center gap-2 text-sm text-[#665B59]">
                    <MapPin size={16} className="text-[#E53935]" />
                    {group.from} <span className="text-[#E53935]">→</span>{" "}
                    {group.destination}
                  </p>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-[#FFF1E8] px-3 py-1 text-xs font-bold text-[#A4491D]">
                  <Users size={14} />
                  {group.members}/{group.maxMembers} members
                </span>
              </div>
              <div className="mt-5 grid gap-3 border-y border-[#EFDED9] py-4 text-sm text-[#665B59] sm:grid-cols-2">
                <p className="flex items-center gap-2">
                  <CalendarDays size={16} className="text-[#E53935]" />
                  {formatGroupDate(group.travelDate)}
                </p>
                <p>
                  <strong className="text-[#171414]">Preferred time:</strong>{" "}
                  {group.preferredTime}
                </p>
              </div>
              <p className="mt-4 min-h-12 text-sm leading-relaxed text-[#665B59]">
                {group.description}
              </p>
              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                {group.joined ? (
                  <Link
                    to={`/groups/${group.id}`}
                    className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl bg-[#E53935] px-5 text-sm font-bold text-white transition hover:brightness-110"
                  >
                    Open Group
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={() => joinGroup(group.id)}
                    disabled={group.members >= group.maxMembers}
                    className="min-h-11 flex-1 rounded-xl bg-[#E53935] px-5 text-sm font-bold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:bg-[#D9CECA]"
                  >
                    {group.members >= group.maxMembers ? "Group Full" : "Join Group"}
                  </button>
                )}
                {!group.joined && (
                  <Link
                    to={`/groups/${group.id}`}
                    className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl border border-[#E53935] px-5 text-sm font-bold text-[#E53935] transition hover:bg-[#FFF1E8]"
                  >
                    View Details
                  </Link>
                )}
              </div>
            </article>
          ))}
        </div>

        {visibleGroups.length === 0 && (
          <p className="rounded-2xl border border-[#EFDED9] bg-white px-5 py-10 text-center text-[#665B59]">
            No groups found for that search.
          </p>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default GroupsPage;
