
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { WorkshopItem } from "@/services/narrativeWorkshop/types"

interface WorkshopAccordionProps {
  items: WorkshopItem[]
}

export function WorkshopAccordion({ items }: WorkshopAccordionProps) {
  return (
    <Accordion type="single" collapsible className="w-full space-y-4">
      {items.map((item) => (
        <AccordionItem 
          key={item.id} 
          value={item.id}
          className="border rounded-lg px-4 bg-card"
        >
          <AccordionTrigger className="hover:no-underline py-4">
            <div className="flex items-center gap-4 text-left w-full overflow-hidden">
              <Badge 
                variant={item.severity === 'critical' ? 'destructive' : 'secondary'}
                className="shrink-0"
              >
                {item.severity.toUpperCase()}
              </Badge>
              <div className="flex flex-col gap-1 min-w-0 flex-1">
                <span className="font-semibold truncate">{item.rubric_category}</span>
                <span className="text-sm text-muted-foreground truncate italic font-serif">
                  "{item.quote}"
                </span>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2 pb-6 space-y-6 border-t mt-2">
            
            {/* The Issue & Why It Matters */}
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2 bg-red-50/50 dark:bg-red-900/10 p-4 rounded-md border border-red-100 dark:border-red-900/20">
                <h4 className="font-medium text-destructive flex items-center gap-2">
                  ⚠️ The Issue
                </h4>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.problem}</p>
              </div>
              <div className="space-y-2 bg-blue-50/50 dark:bg-blue-900/10 p-4 rounded-md border border-blue-100 dark:border-blue-900/20">
                <h4 className="font-medium text-blue-600 dark:text-blue-400 flex items-center gap-2">
                  💡 Why it matters
                </h4>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.why_it_matters}</p>
              </div>
            </div>

            {/* Suggestion Cards */}
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">Generated Options</h4>
                <span className="text-xs text-muted-foreground">Scroll to see all 3 options →</span>
              </div>
              
              <ScrollArea className="w-full whitespace-nowrap rounded-xl border bg-muted/20 p-4">
                <div className="flex w-max space-x-4">
                  {item.suggestions.map((suggestion, index) => (
                    <Card key={index} className="w-[400px] shrink-0 whitespace-normal border-muted-foreground/20 shadow-sm hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <Badge 
                            variant="outline" 
                            className={`capitalize ${
                              suggestion.type === 'polished_original' ? 'border-green-500 text-green-600 bg-green-50' :
                              suggestion.type === 'voice_amplifier' ? 'border-purple-500 text-purple-600 bg-purple-50' :
                              'border-orange-500 text-orange-600 bg-orange-50'
                            }`}
                          >
                            {suggestion.type.replace(/_/g, ' ')}
                          </Badge>
                          <span className="text-xs text-muted-foreground font-mono">Option {index + 1}</span>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="relative">
                          <div className="absolute -left-2 -top-2 text-2xl text-muted-foreground/20 font-serif">"</div>
                          <p className="text-sm font-serif leading-relaxed pl-2 italic text-foreground/90">
                            {suggestion.text}
                          </p>
                        </div>
                        <div className="text-xs text-muted-foreground border-t pt-3">
                          <span className="font-semibold text-foreground">Rationale: </span>
                          {suggestion.rationale}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            </div>

          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  )
}


