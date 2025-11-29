import { motion } from 'motion/react';
import { Quote } from 'lucide-react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Card, CardContent } from "@/components/ui/card";

const testimonials = [
  {
    text: "I spent 3 years modding Discord servers and thought it was a waste of time. The scanner pointed out how that's actually community management and technical leadership. It's now my strongest PIQ.",
    classYear: "Class of 2028",
    gradient: "from-blue-400 to-indigo-500"
  },
  {
    text: "My first draft was just a list of accomplishments. Uplift told me to focus on *why* I started my baking business, not just how much money I made. It completely changed the tone of my application.",
    classYear: "Class of 2029",
    gradient: "from-purple-400 to-rose-500"
  },
  {
    text: "I finished my draft at 1 AM and needed eyes on it. My counselor was asleep, obviously. Uplift caught that I used the word 'passion' six times and gave me better synonyms instantly.",
    classYear: "Class of 2028",
    gradient: "from-amber-400 to-orange-500"
  }
];

const Testimonials = () => {
  return (
    <section className="py-24 overflow-hidden bg-slate-50 dark:bg-transparent">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            What students say after their first scan
          </h2>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-5xl mx-auto"
        >
          <Carousel
            opts={{
              align: "start",
              loop: true,
            }}
            className="w-full"
          >
            <CarouselContent className="-ml-4">
              {testimonials.map((testimonial, index) => (
                <CarouselItem key={index} className="pl-4 md:basis-1/2">
                  <Card className="h-full border-none shadow-sm bg-background">
                    <CardContent className="p-8 flex flex-col h-full">
                      <Quote className="w-8 h-8 text-primary/10 mb-6" />
                      <p className="text-lg mb-8 relative z-10 flex-grow">
                        "{testimonial.text}"
                      </p>
                      <div className="flex items-center gap-3 mt-auto">
                        <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${testimonial.gradient}`} />
                        <div>
                          <div className="font-semibold">Student</div>
                          <div className="text-xs text-muted-foreground">{testimonial.classYear}</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </CarouselItem>
              ))}
            </CarouselContent>
            <div className="hidden md:block">
              <CarouselPrevious className="-left-12" />
              <CarouselNext className="-right-12" />
            </div>
            {/* Mobile controls below */}
            <div className="flex justify-center gap-4 mt-8 md:hidden">
              <CarouselPrevious className="static translate-y-0" />
              <CarouselNext className="static translate-y-0" />
            </div>
          </Carousel>
        </motion.div>

        <div className="mt-12 text-center">
          <p className="text-sm text-muted-foreground">
            Created by first-gen and non-traditional students who’ve been through this process.
          </p>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
