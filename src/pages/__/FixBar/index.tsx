import { scrollTo } from '@/lib/scroll-to';
import Button from '@/pures/react/Button';
import { useEffect, useState } from 'react';

export const FixBar = () => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const contentElement = document.querySelector('.content');
      if (contentElement) {
        const rect = contentElement.getBoundingClientRect();
        setShow(rect.top <= 200);
      } else {
        setShow(false);
      }
    };

    // Initial check
    handleScroll();

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!show) return null;

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white p-2 text-center font-semibold z-50 border-t border-gray-200 shadow-lg">
      <Button
        className="w-full"
        onClick={() => {
          const visibleSkus = [...document.querySelectorAll('.skus')].find(
            (el) => (el as HTMLElement).offsetParent !== null,
          );
          if (visibleSkus) {
            scrollTo(visibleSkus as HTMLDivElement);
          }
        }}
      >
        View Available Offers
      </Button>
    </div>
  );
};
