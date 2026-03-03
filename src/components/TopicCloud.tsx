const words = [
  { text: "Clean Air", size: 48, opacity: 1 },
  { text: "Jobs", size: 40, opacity: 0.9 },
  { text: "Health", size: 44, opacity: 1 },
  { text: "Economy", size: 36, opacity: 0.85 },
  { text: "Timeline", size: 32, opacity: 0.8 },
  { text: "Small Business", size: 34, opacity: 0.85 },
  { text: "Tax Credits", size: 28, opacity: 0.75 },
  { text: "Emissions", size: 38, opacity: 0.9 },
  { text: "Rural Impact", size: 26, opacity: 0.7 },
  { text: "Compliance", size: 30, opacity: 0.8 },
  { text: "Innovation", size: 24, opacity: 0.65 },
  { text: "Workforce", size: 28, opacity: 0.75 },
  { text: "Pollution", size: 36, opacity: 0.85 },
  { text: "Subsidies", size: 22, opacity: 0.6 },
  { text: "Transition", size: 26, opacity: 0.7 },
  { text: "Infrastructure", size: 24, opacity: 0.65 },
];

export default function TopicCloud() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 p-4">
      {words.map((w) => {
        // Map size values (22-48) to responsive classes
        const getResponsiveSize = (size: number) => {
          if (size >= 44) return "text-3xl md:text-5xl";
          if (size >= 36) return "text-2xl md:text-4xl";
          if (size >= 30) return "text-xl md:text-3xl";
          if (size >= 24) return "text-lg md:text-2xl";
          return "text-sm md:text-xl";
        };

        return (
          <span
            key={w.text}
            className={`cursor-pointer font-display font-bold text-primary transition-all hover:text-accent hover:scale-110 ${getResponsiveSize(w.size)}`}
            style={{ opacity: w.opacity }}
          >
            {w.text}
          </span>
        );
      })}
    </div>
  );
}
