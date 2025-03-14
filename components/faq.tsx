import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export function FAQ() {
  const faqs = [
    {
      question:
        "Do any other companies (like OpenAI, Anthropic/Claude, etc) store and have access to my child's data?",
      answer: `Nope, never!
      While we use AI models from companies like OpenAI etc., our service agreement with them specifically does not permit them to save or store the messages. Only ChatGPT4Kids ever has access to messages so that you can review them.`,
    },
    {
      question:
        "Why not use ChatGPT (or other big AI model companies) directly?",
      answer:
        "Our platform is specifically designed with children's safety, development, and age-appropriate learning in mind. We've created customized content moderation, a child-friendly interface, and educational frameworks that general AI platforms don't offer. Our solution focuses exclusively on providing a secure, enriching environment for children's learning, and putting you—the parent—in control.",
    },
    {
      question: "Will my child become too dependent on this?",
      answer:
        "We've designed our platform to encourage critical thinking and independent learning. Rather than simply providing answers, our AI guides children through problem-solving processes and encourages exploration. Soon, parents will also be able to set usage limits and review learning reports to ensure balanced use of this technology.",
    },
    {
      question:
        "Privacy & Security: Will anyone have access to my child's information and history?",
      answer:
        "Your child's privacy is our top priority. Only authorized parents/guardians have access to their child's information and conversation history through the parent dashboard. We implement strict data security measures and never share or sell your child's data to third parties.",
    },
    {
      question: "Is ChatGPT4Kids perfect and 100% foolproof?",
      answer:
        "While we've implemented comprehensive safety measures and content moderation, no technology system is 100% foolproof. We continuously improve our safeguards and recommend parent supervision, especially for younger children. Our custom rules feature allows parents to tailor the experience based on their family's needs and values.",
    },
  ];

  return (
    <section id="faq" className="py-12 md:py-24 bg-muted/30">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="space-y-2">
            <div className="inline-block rounded-lg bg-primary px-3 py-1 text-sm text-primary-foreground">
              FAQ
            </div>
            <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">
              Frequently Asked Questions
            </h2>
            <p className="max-w-[700px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
              Get answers to common questions about ChatGPT4Kids
            </p>
          </div>
        </div>
        <div className="mx-auto max-w-3xl mt-8">
          <Accordion type="multiple" className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left font-medium">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.answer.split("\n").map((paragraph, i) => (
                    <p key={i} className={i > 0 ? "mt-2" : ""}>
                      {paragraph.trim()}
                    </p>
                  ))}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}
