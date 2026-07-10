const ProgressBar = ({ progress = 0 }: { progress?: number }) => {
  return (
    <div className="relative h-6 overflow-hidden rounded-full bg-muted py-1.5">
      <div
        style={{
          width: `${progress}%`,
        }}
        className="absolute inset-y-0 left-0 h-full bg-primary transition-all duration-150"
      ></div>
      <div className="absolute top-0 bottom-0 left-0 flex items-center justify-center w-full h-full">
        <span className="text-xs font-bold text-foreground mix-blend-difference dark:mix-blend-normal dark:text-primary-foreground">{progress}%</span>
      </div>
    </div>
  );
};

export default ProgressBar;
