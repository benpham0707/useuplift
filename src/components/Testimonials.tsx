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
    text: "I was panicking about my essay topic because everyone said avoid 'trauma'. The scanner showed me how to frame my family responsibilities as leadership instead. Accepted to my dream UC!",
    classYear: "Class of 2028",
    gradient: "from-blue-400 to-indigo-500"
  },
  {
    text: "My counselor has 400 students. This tool gave me the specific feedback on my PIQs that I couldn't get anywhere else. It caught that I wasn't being specific enough about my coding projects.",
    classYear: "Class of 2029",
    gradient: "from-purple-400 to-rose-500"
  },
  {
    text: "I thought I had nothing to write about. The Quick Scan pulled out things I do every day—like translating for my parents—and showed me how valuable they actually are for college apps.",
    classYear: "Class of 2028",
    gradient: "from-amber-400 to-orange-500"
  },
  {
    text: "The feedback wasn't just 'good job'. It told me exactly where I was being vague and how to show my impact. It felt like a real editor was looking at my work.",
    classYear: "Class of 2029",
    gradient: "from-emerald-400 to-teal-500"
  },
  {
    text: "Being first-gen, I didn't know the 'language' of admissions. Uplift helped me translate my real life into what colleges are looking for without sounding fake.",
    classYear: "Class of 2028",
    gradient: "from-cyan-400 to-blue-500"
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
