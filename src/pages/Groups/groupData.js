export const mockGroups = [
  {
    id: 1,
    name: "Puri Group 01",
    from: "Astarang",
    destination: "Puri",
    travelDate: "2026-10-05",
    preferredTime: "Morning",
    members: 4,
    maxMembers: 7,
    description:
      "Planning to go to Puri and looking for people to share a cab.",
    joined: false,
    memberList: ["Saroj", "Rakesh", "Priya", "Anita"],
    messages: [
      { sender: "Saroj", text: "Who all can go around 7 AM?", time: "09:12 AM" },
      { sender: "Rakesh", text: "7 AM is fine for me.", time: "09:15 AM" },
      {
        sender: "Priya",
        text: "If we get 5 people we can hire a full cab.",
        time: "09:18 AM",
      },
    ],
  },
  {
    id: 2,
    name: "Bhubaneswar Work Trip",
    from: "Astarang",
    destination: "Bhubaneswar",
    travelDate: "2026-10-08",
    preferredTime: "Early Morning",
    members: 3,
    maxMembers: 6,
    description: "Looking for fellow travellers heading to the city for work.",
    joined: false,
    memberList: ["Meena", "Bikash", "Sanjay"],
    messages: [
      { sender: "Meena", text: "Should we meet at the bus stand?", time: "06:40 PM" },
    ],
  },
  {
    id: 3,
    name: "Konark Weekend Plan",
    from: "Puri",
    destination: "Konark",
    travelDate: "2026-10-12",
    preferredTime: "Afternoon",
    members: 5,
    maxMembers: 8,
    description: "Planning a relaxed weekend visit and sharing travel costs.",
    joined: true,
    memberList: ["You", "Asha", "Ravi", "Kunal", "Deepa"],
    messages: [
      { sender: "Asha", text: "Let us decide the pickup point tomorrow.", time: "08:05 PM" },
    ],
  },
];

export const formatGroupDate = (date) =>
  new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(`${date}T00:00:00`));
