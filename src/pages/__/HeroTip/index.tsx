interface HeroTipProps {
  children?: string;
}

export const HeroTip = ({ children }: HeroTipProps) => {
  if (!children) return null;

  return (
    <div className="wrap mb-3 text-center font-h text-2xl py-5">
      <b className="text-xl md:text-3xl font-bold">{children}</b>
    </div>
  );
};
