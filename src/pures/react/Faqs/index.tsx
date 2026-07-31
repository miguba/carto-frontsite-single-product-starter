import React from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import classNames from 'classnames';
import type { FaqGroup } from '@/types/app.type';

interface IProps {
  className?: string;
  faqGroups: FaqGroup[];
}

export const Faqs: React.FC<IProps> = ({ className, faqGroups }) => {
  return (
    <div className={classNames([``, className])}>
      <Accordion
        type="multiple"
        defaultValue={faqGroups.map((_, i) => `item-${i}`)}
        className="w-full"
      >
        {faqGroups.map((n, i) => {
          return (
            <AccordionItem value={`item-${i}`} key={i} className="border-b-0">
              <AccordionTrigger className="py-4 text-left font-h text-lg font-bold hover:no-underline">
                {n.title}
              </AccordionTrigger>

              <AccordionContent className="pt-4 pb-2">
                <div className="grid grid-cols-1 gap-x-10 gap-y-8 md:grid-cols-2 lg:grid-cols-3">
                  {n.faqs.map((nn, ii) => {
                    return (
                      <div key={ii}>
                        <h3 className="mb-3 font-h text-xl leading-tight font-bold text-gray-950">
                          {nn.a}
                        </h3>

                        {nn.q.map((nnn, iii) => {
                          return (
                            <p
                              className="text-base leading-7 text-gray-600"
                              key={iii}
                            >
                              {nnn}
                            </p>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
};
