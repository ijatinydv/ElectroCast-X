"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Slider } from "@/components/ui/slider";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Toggle } from "@/components/ui/toggle";

import { Panel } from "@/components/ui/Panel";
import { Stat } from "@/components/ui/Stat";
import { Chip } from "@/components/ui/Chip";
import { StatusDot } from "@/components/ui/StatusDot";
import { Sparkline } from "@/components/ui/Sparkline";
import { NumberTicker } from "@/components/ui/NumberTicker";
import { Dial } from "@/components/ui/Dial";

export default function KitchenSinkPage() {
  const [dialValue, setDialValue] = React.useState(25);
  const [sliderVal, setSliderVal] = React.useState([25]);
  const [rising, setRising] = React.useState(false);

  React.useEffect(() => {
    if (sliderVal[0] !== undefined) {
      setRising(sliderVal[0] > dialValue);
      setDialValue(sliderVal[0]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sliderVal]);

  return (
    <div className="p-8 max-w-5xl mx-auto flex flex-col gap-12 pb-24 text-fg">
      <h1 className="text-3xl font-medium tracking-tight uppercase">Kitchen Sink</h1>
      
      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-medium border-b border-line pb-2">1. shadcn/ui Primitives (Restyled)</h2>
        
        <div className="flex flex-col gap-8">
          {/* Button */}
          <div>
            <h3 className="text-sm font-medium mb-3 text-fg-2">Button</h3>
            <div className="flex flex-wrap gap-4 items-center">
              <Button variant="default">Default</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="destructive">Destructive</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="link">Link</Button>
              <Button disabled>Disabled</Button>
            </div>
          </div>

          {/* Switch & Toggle */}
          <div className="flex flex-wrap gap-12">
            <div>
              <h3 className="text-sm font-medium mb-3 text-fg-2">Switch</h3>
              <div className="flex gap-4">
                <Switch />
                <Switch checked />
                <Switch disabled />
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium mb-3 text-fg-2">Toggle</h3>
              <div className="flex gap-4">
                <Toggle>Default</Toggle>
                <Toggle pressed>Pressed</Toggle>
                <Toggle disabled>Disabled</Toggle>
              </div>
            </div>
          </div>

          {/* Slider */}
          <div>
            <h3 className="text-sm font-medium mb-3 text-fg-2">Slider (controls dial)</h3>
            <div className="w-64">
              <Slider value={sliderVal} onValueChange={setSliderVal} max={100} step={1} />
            </div>
          </div>

          {/* Tabs */}
          <div>
            <h3 className="text-sm font-medium mb-3 text-fg-2">Tabs</h3>
            <Tabs defaultValue="tab1" className="w-[400px]">
              <TabsList>
                <TabsTrigger value="tab1">Tab 1</TabsTrigger>
                <TabsTrigger value="tab2">Tab 2</TabsTrigger>
                <TabsTrigger value="tab3" disabled>Disabled</TabsTrigger>
              </TabsList>
              <TabsContent value="tab1" className="text-sm text-fg-2 mt-2">Content 1</TabsContent>
              <TabsContent value="tab2" className="text-sm text-fg-2 mt-2">Content 2</TabsContent>
            </Tabs>
          </div>

          {/* Overlays: Tooltip, Dialog, Sheet */}
          <div>
            <h3 className="text-sm font-medium mb-3 text-fg-2">Overlays</h3>
            <div className="flex gap-4">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline">Hover me</Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Tooltip content</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline">Open Dialog</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px] bg-rail border-line">
                  <div className="p-4">Dialog Content</div>
                </DialogContent>
              </Dialog>

              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline">Open Sheet</Button>
                </SheetTrigger>
                <SheetContent className="bg-rail border-line">
                  <div className="p-4">Sheet Content</div>
                </SheetContent>
              </Sheet>
            </div>
          </div>

          {/* ScrollArea */}
          <div>
            <h3 className="text-sm font-medium mb-3 text-fg-2">ScrollArea</h3>
            <ScrollArea className="h-32 w-64 border border-line p-4">
              {Array.from({ length: 20 }).map((_, i) => (
                <div key={i} className="text-sm mb-2">Item {i + 1}</div>
              ))}
            </ScrollArea>
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-medium border-b border-line pb-2">2. Custom Components</h2>
        
        <div className="flex flex-col gap-8">
          {/* Panel */}
          <div>
            <h3 className="text-sm font-medium mb-3 text-fg-2">Panel</h3>
            <div className="grid grid-cols-2 gap-4">
              <Panel title="Expanded Panel" defaultOpen={true}>
                <p className="text-sm text-fg-2">This is the panel content.</p>
              </Panel>
              <Panel title="Collapsed Panel" defaultOpen={false}>
                <p className="text-sm text-fg-2">This is the panel content.</p>
              </Panel>
            </div>
          </div>

          {/* Stat & NumberTicker */}
          <div>
            <h3 className="text-sm font-medium mb-3 text-fg-2">Stat & NumberTicker</h3>
            <div className="flex gap-8">
              <Stat label="Total flashes" value={<NumberTicker value={142} />} delta="12" deltaTrend="up" />
              <Stat label="Active cells" value={<NumberTicker value={4} />} delta="1" deltaTrend="down" />
              <Stat label="Average intensity" value="45 dBZ" />
            </div>
          </div>

          {/* Chips */}
          <div>
            <h3 className="text-sm font-medium mb-3 text-fg-2">Chips</h3>
            <div className="flex gap-4">
              <Chip variant="neutral">Neutral</Chip>
              <Chip variant="observed">Observed</Chip>
              <Chip variant="forecast">Forecast</Chip>
              <Chip variant="risk">Risk</Chip>
              <Chip variant="alert">Alert</Chip>
            </div>
          </div>

          {/* StatusDot */}
          <div>
            <h3 className="text-sm font-medium mb-3 text-fg-2">StatusDot</h3>
            <div className="flex gap-4 items-center">
              <div className="flex items-center gap-2"><StatusDot status="online" /> <span className="text-sm">Online</span></div>
              <div className="flex items-center gap-2"><StatusDot status="delayed" /> <span className="text-sm">Delayed</span></div>
              <div className="flex items-center gap-2"><StatusDot status="offline" /> <span className="text-sm">Offline</span></div>
            </div>
          </div>

          {/* Sparkline */}
          <div>
            <h3 className="text-sm font-medium mb-3 text-fg-2">Sparkline</h3>
            <div className="flex gap-8">
              <Sparkline values={[10, 20, 15, 30, 25, 40]} color="var(--color-observed)" markerIndex={5} />
              <Sparkline values={[40, 30, 50, 20, 10]} color="var(--color-risk)" markerIndex={4} />
            </div>
          </div>

          {/* Dial */}
          <div>
            <h3 className="text-sm font-medium mb-3 text-fg-2">First-Flash Dial</h3>
            <div className="flex gap-8 items-center bg-rail p-8 border border-line rounded-lg w-max">
              <Dial probability={dialValue} rising={rising} windowStart={15} windowEnd={30} />
            </div>
            <p className="text-xs text-fg-3 mt-2">Adjust the slider above to animate the dial and trigger the pulse.</p>
          </div>

        </div>
      </section>
    </div>
  );
}
