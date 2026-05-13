const AuthImagePattern = ({
  title = "Hello, good to see you again",
  subtitle = "Sign in to access your chats and stay connected.",
}) => {
  return (
    <div className="hidden lg:flex items-center justify-center bg-base-200 p-12 relative overflow-hidden">

      {/* Background glow */}
      <div className="absolute w-72 h-72 bg-primary/20 rounded-full blur-3xl top-10 left-10 animate-pulse" />
      <div className="absolute w-72 h-72 bg-secondary/20 rounded-full blur-3xl bottom-10 right-10 animate-pulse" />

      <div className="max-w-md text-center relative z-10">

        {/* Animated chat-style grid */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          {[...Array(9)].map((_, i) => (
            <div
              key={i}
              className="aspect-square rounded-2xl bg-base-100 border border-base-300 shadow-md relative overflow-hidden flex items-center justify-center"
            >
              {/* Animated pulse layers */}
              <div
                className={`absolute inset-0 ${i % 3 === 0
                    ? "bg-primary/20 animate-pulse"
                    : i % 3 === 1
                      ? "bg-secondary/20 animate-pulse delay-150"
                      : "bg-success/20 animate-pulse delay-300"
                  }`}
              />

              {/* Chat activity dot */}
              <div className="w-2 h-2 rounded-full bg-base-content/30 z-10 animate-bounce" />
            </div>
          ))}
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold mb-3">
          {title}
        </h2>

        {/* Subtitle */}
        <p className="text-base-content/60 leading-relaxed">
          {subtitle}
        </p>

      </div>
    </div>
  );
};

export default AuthImagePattern;