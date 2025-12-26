import { useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Link } from "react-router-dom";
import { 
  Search, 
  FileCheck, 
  Handshake, 
  Home,
  Upload,
  CheckCircle,
  Users,
  ArrowRight,
  HelpCircle
} from "lucide-react";

const buyerSteps = [
  {
    icon: Search,
    title: "Browse Assignments",
    description: "Explore our curated marketplace of pre-construction assignment sales across Vancouver. Filter by location, price, and property type."
  },
  {
    icon: FileCheck,
    title: "Review Details",
    description: "Each listing includes floor plans, deposit structure, completion dates, and verified agent information for complete transparency."
  },
  {
    icon: Handshake,
    title: "Connect with Agent",
    description: "Submit an inquiry to connect directly with the listing agent. All agents are licensed and verified."
  },
  {
    icon: Home,
    title: "Complete Purchase",
    description: "Work with the agent to complete due diligence, negotiate terms, and finalize the assignment transfer."
  }
];

const sellerSteps = [
  {
    icon: Upload,
    title: "Submit Your Listing",
    description: "Create an account, verify your license, and submit your assignment listing with all relevant details and documents."
  },
  {
    icon: CheckCircle,
    title: "Admin Review",
    description: "Our team reviews each listing for accuracy and compliance before publishing to ensure marketplace quality."
  },
  {
    icon: Users,
    title: "Receive Inquiries",
    description: "Get direct inquiries from qualified buyers through our secure lead capture system."
  },
  {
    icon: Handshake,
    title: "Close the Deal",
    description: "Work with interested buyers to complete the assignment sale and earn your commission."
  }
];

const faqs = [
  {
    question: "Is AssignmentHub free to use for buyers?",
    answer: "Yes, browsing listings and contacting agents is completely free for buyers. There are no fees or subscriptions required. You can browse, search, and inquire on any listing at no cost."
  },
  {
    question: "How are agents verified?",
    answer: "All agents must provide their real estate license number and brokerage information during registration. Our team verifies each agent's credentials with the appropriate regulatory body before they can list properties on our platform."
  },
  {
    question: "How much does it cost to list an assignment?",
    answer: "We charge a flat fee per listing for 365 days of visibility. This includes unlimited inquiries and the ability to update your listing at any time. Contact us or register as an agent to see current pricing."
  },
  {
    question: "Are all listings reviewed before publishing?",
    answer: "Yes, every listing is reviewed by our admin team to ensure accuracy, completeness, and compliance with platform guidelines before going live. This typically takes 1-2 business days."
  },
  {
    question: "What documents do I need to complete an assignment purchase?",
    answer: "Typically you'll need the original purchase agreement, assignment agreement, developer consent (if required), and financing pre-approval. Your agent will guide you through the specific requirements for each property."
  },
  {
    question: "Can developers restrict assignment sales?",
    answer: "Yes, some developers have restrictions on assignment sales, including blackout periods or assignment fees. Each listing on our platform includes information about any known restrictions, but buyers should always verify with the developer."
  },
  {
    question: "How long does an assignment transaction take?",
    answer: "Assignment transactions typically take 2-4 weeks from accepted offer to completion, depending on developer requirements and financing timelines. This is faster than traditional resale purchases."
  },
  {
    question: "What is the difference between assignment price and original purchase price?",
    answer: "The original purchase price is what the seller paid the developer. The assignment price is what the new buyer pays, which may be higher or lower depending on market conditions. The difference represents the seller's gain or loss."
  }
];

export default function HowItWorks() {
  useEffect(() => {
    document.title = "How It Works | AssignmentHub Vancouver - Assignment Sale Guide";
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute("content", "Learn how assignment sales work in Vancouver. Step-by-step guides for buyers and agents, FAQs, and everything you need to know about pre-construction assignments.");
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-16 md:py-24 bg-gradient-to-b from-muted/50 to-background">
          <div className="container text-center">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
              How Assignment<span className="text-primary">Hub</span> Works
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Vancouver's trusted marketplace connecting pre-construction assignment sellers with qualified buyers through verified real estate professionals.
            </p>
          </div>
        </section>

        {/* What is an Assignment */}
        <section className="py-16 border-b border-border">
          <div className="container">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl font-bold mb-6">What is an Assignment Sale?</h2>
              <p className="text-lg text-muted-foreground mb-8">
                An assignment sale occurs when an original buyer of a pre-construction property sells their purchase contract to a new buyer before the building is completed. The new buyer "steps into the shoes" of the original buyer, taking over the contract and all its terms.
              </p>
              <div className="grid md:grid-cols-3 gap-6 text-left">
                <Card className="border-primary/20">
                  <CardContent className="pt-6">
                    <h3 className="font-semibold mb-2">For Buyers</h3>
                    <p className="text-sm text-muted-foreground">
                      Access properties at potentially lower prices than current market rates, with shorter wait times to occupancy.
                    </p>
                  </CardContent>
                </Card>
                <Card className="border-primary/20">
                  <CardContent className="pt-6">
                    <h3 className="font-semibold mb-2">For Sellers</h3>
                    <p className="text-sm text-muted-foreground">
                      Realize gains on your investment or exit a purchase obligation due to changed circumstances.
                    </p>
                  </CardContent>
                </Card>
                <Card className="border-primary/20">
                  <CardContent className="pt-6">
                    <h3 className="font-semibold mb-2">For Agents</h3>
                    <p className="text-sm text-muted-foreground">
                      Expand your client base and earn commissions by facilitating assignment transactions.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* For Buyers */}
        <section className="py-16 bg-muted/30">
          <div className="container">
            <div className="text-center mb-12">
              <span className="text-primary font-medium uppercase tracking-wider text-sm">For Buyers</span>
              <h2 className="text-3xl font-bold mt-2">Find Your Perfect Assignment</h2>
              <p className="text-muted-foreground mt-4 max-w-xl mx-auto">
                Browse verified listings and connect with licensed agents to secure your next property.
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {buyerSteps.map((step, index) => (
                <div key={index} className="relative">
                  <Card className="h-full hover:shadow-lg transition-shadow">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <step.icon className="h-5 w-5 text-primary" />
                        </div>
                        <span className="text-2xl font-bold text-primary/30">{index + 1}</span>
                      </div>
                      <h3 className="font-semibold mb-2">{step.title}</h3>
                      <p className="text-sm text-muted-foreground">{step.description}</p>
                    </CardContent>
                  </Card>
                  {index < buyerSteps.length - 1 && (
                    <ArrowRight className="hidden lg:block absolute top-1/2 -right-3 transform -translate-y-1/2 text-muted-foreground/30 h-6 w-6" />
                  )}
                </div>
              ))}
            </div>
            
            <div className="text-center mt-10">
              <Link to="/assignments">
                <Button size="lg" className="shadow-gold">
                  Browse Assignments
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* For Agents/Sellers */}
        <section className="py-16">
          <div className="container">
            <div className="text-center mb-12">
              <span className="text-primary font-medium uppercase tracking-wider text-sm">For Agents</span>
              <h2 className="text-3xl font-bold mt-2">List Your Assignments</h2>
              <p className="text-muted-foreground mt-4 max-w-xl mx-auto">
                Reach qualified buyers and grow your business with our agent-focused platform.
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {sellerSteps.map((step, index) => (
                <div key={index} className="relative">
                  <Card className="h-full hover:shadow-lg transition-shadow">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <step.icon className="h-5 w-5 text-primary" />
                        </div>
                        <span className="text-2xl font-bold text-primary/30">{index + 1}</span>
                      </div>
                      <h3 className="font-semibold mb-2">{step.title}</h3>
                      <p className="text-sm text-muted-foreground">{step.description}</p>
                    </CardContent>
                  </Card>
                  {index < sellerSteps.length - 1 && (
                    <ArrowRight className="hidden lg:block absolute top-1/2 -right-3 transform -translate-y-1/2 text-muted-foreground/30 h-6 w-6" />
                  )}
                </div>
              ))}
            </div>
            
            <div className="text-center mt-10">
              <Link to="/login">
                <Button size="lg" variant="outline">
                  Agent Login
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-16 bg-muted/30 border-t border-border">
          <div className="container">
            <div className="text-center mb-12">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-4">
                <HelpCircle className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-3xl font-bold">Frequently Asked Questions</h2>
              <p className="text-muted-foreground mt-2">
                Everything you need to know about assignment sales
              </p>
            </div>
            
            <div className="max-w-3xl mx-auto">
              <Accordion type="single" collapsible className="space-y-4">
                {faqs.map((faq, index) => (
                  <AccordionItem 
                    key={index} 
                    value={`faq-${index}`}
                    className="bg-card border border-border rounded-lg px-6"
                  >
                    <AccordionTrigger className="text-left font-semibold hover:no-underline">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-primary text-primary-foreground">
          <div className="container text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
            <p className="text-primary-foreground/80 mb-8 max-w-xl mx-auto">
              Whether you're looking to buy or list an assignment, AssignmentHub connects you with the right people.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/assignments">
                <Button size="lg" variant="secondary">
                  Browse Assignments
                </Button>
              </Link>
              <Link to="/login">
                <Button size="lg" variant="outline" className="border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10">
                  Agent Login
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
}
