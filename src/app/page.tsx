import { Hero } from "@/components/landing/Hero";
import { QuestionSections } from "@/components/landing/QuestionSections";

// composes the landing route from its live product hero and explanatory forecast views
export default function Home() {
  return (
    <main>
      <Hero />
      <QuestionSections />
    </main>
  );
}
