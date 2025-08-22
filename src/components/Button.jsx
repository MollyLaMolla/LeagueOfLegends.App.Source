const Button = ({ id, title, leftIcon, rightIcon, containerClass }) => {
  return (
    <button
      id={id}
      className={`relative z-10 w-fit cursor-pointer overflow-hidden rounded-full transition-all duration-300 ease-in-out bg-league-of-legends-blue-400 px-7 py-3 text-black ${containerClass}`}
    >
      {leftIcon}

      <span className="relative inline-flex overflow-hidden font-family-general text-xs uppercase user-select-none">
        {title}
      </span>

      {rightIcon}
    </button>
  );
};

export default Button;
