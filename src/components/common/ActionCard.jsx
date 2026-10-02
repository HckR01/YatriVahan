const ActionCard = ({ icon: Icon, title, description, onClick }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group w-full rounded-2xl border border-[#EFDED9] bg-white p-6 text-left
                 shadow-[0_18px_44px_rgba(59,13,18,0.08)]
                 transition duration-200
                 hover:-translate-y-1
                 hover:border-[#F3B4A7]
                 hover:shadow-[0_22px_45px_rgba(101,21,27,0.13)]"
    >
      <div className="mb-5 grid h-[47px] w-[47px] place-items-center rounded-[15px] bg-[#FFF1E8] text-[#E53935]">
        <Icon size={22} />
      </div>

      <h3 className="mb-2 text-[21px] font-bold text-[#171414]">{title}</h3>

      <p className="text-[16px] text-[#665B59]">{description}</p>
    </button>
  );
};

export default ActionCard;
