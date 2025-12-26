import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Mail, Phone, MapPin, Send, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";

const contactSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
  email: z.string().trim().email("Invalid email address").max(255, "Email must be less than 255 characters"),
  phone: z.string().trim().max(20, "Phone must be less than 20 characters").optional(),
  subject: z.string().trim().min(1, "Subject is required").max(200, "Subject must be less than 200 characters"),
  message: z.string().trim().min(1, "Message is required").max(2000, "Message must be less than 2000 characters"),
});

type ContactFormData = z.infer<typeof contactSchema>;

export default function Contact() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formData, setFormData] = useState<ContactFormData>({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof ContactFormData, string>>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof ContactFormData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = contactSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof ContactFormData, string>> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as keyof ContactFormData] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('send-contact-email', {
        body: result.data,
      });

      if (error) {
        throw new Error(error.message || "Failed to send message");
      }

      setIsSubmitted(true);
      toast({
        title: "Message sent!",
        description: "We'll get back to you as soon as possible.",
      });
    } catch (error: any) {
      console.error("Error sending contact form:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <>
        <Helmet>
          <title>Contact Us | AssignmentHub</title>
          <meta name="description" content="Get in touch with AssignmentHub. We're here to help with your pre-construction assignment questions." />
        </Helmet>
        <div className="min-h-screen flex flex-col bg-background">
          <Header />
          <main className="flex-1 container py-16">
            <div className="max-w-lg mx-auto text-center">
              <div className="mb-6 inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10">
                <CheckCircle className="h-8 w-8 text-primary" />
              </div>
              <h1 className="text-3xl font-bold mb-4">Thank You!</h1>
              <p className="text-muted-foreground mb-8">
                Your message has been received. Our team will review your inquiry and get back to you within 24-48 hours.
              </p>
              <Button onClick={() => setIsSubmitted(false)}>Send Another Message</Button>
            </div>
          </main>
          <Footer />
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>Contact Us | AssignmentHub</title>
        <meta name="description" content="Get in touch with AssignmentHub. We're here to help with your pre-construction assignment questions." />
      </Helmet>
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1">
          {/* Hero Section */}
          <section className="py-16 md:py-24 bg-gradient-to-b from-primary/5 to-background">
            <div className="container text-center">
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
                Get in Touch
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Have questions about assignment sales? Want to list your property? We're here to help.
              </p>
            </div>
          </section>

          {/* Contact Content */}
          <section className="py-16">
            <div className="container">
              <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
                {/* Contact Info Cards */}
                <div className="space-y-6">
                  <Card>
                    <CardContent className="flex items-start gap-4 p-6">
                      <div className="p-3 rounded-lg bg-primary/10">
                        <Mail className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold mb-1">Email Us</h3>
                        <a 
                          href="mailto:info@assignmenthub.ca" 
                          className="text-muted-foreground hover:text-primary transition-colors"
                        >
                          info@assignmenthub.ca
                        </a>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="flex items-start gap-4 p-6">
                      <div className="p-3 rounded-lg bg-primary/10">
                        <Phone className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold mb-1">Call Us</h3>
                        <a 
                          href="tel:+14165551234" 
                          className="text-muted-foreground hover:text-primary transition-colors"
                        >
                          (416) 555-1234
                        </a>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="flex items-start gap-4 p-6">
                      <div className="p-3 rounded-lg bg-primary/10">
                        <MapPin className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold mb-1">Location</h3>
                        <p className="text-muted-foreground">
                          Toronto, Ontario<br />
                          Canada
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Contact Form */}
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle>Send Us a Message</CardTitle>
                    <CardDescription>
                      Fill out the form below and we'll get back to you as soon as possible.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="name">Name *</Label>
                          <Input
                            id="name"
                            name="name"
                            placeholder="Your name"
                            value={formData.name}
                            onChange={handleChange}
                            className={errors.name ? "border-destructive" : ""}
                          />
                          {errors.name && (
                            <p className="text-sm text-destructive">{errors.name}</p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email">Email *</Label>
                          <Input
                            id="email"
                            name="email"
                            type="email"
                            placeholder="your@email.com"
                            value={formData.email}
                            onChange={handleChange}
                            className={errors.email ? "border-destructive" : ""}
                          />
                          {errors.email && (
                            <p className="text-sm text-destructive">{errors.email}</p>
                          )}
                        </div>
                      </div>

                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="phone">Phone</Label>
                          <Input
                            id="phone"
                            name="phone"
                            type="tel"
                            placeholder="(416) 555-1234"
                            value={formData.phone}
                            onChange={handleChange}
                            className={errors.phone ? "border-destructive" : ""}
                          />
                          {errors.phone && (
                            <p className="text-sm text-destructive">{errors.phone}</p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="subject">Subject *</Label>
                          <Input
                            id="subject"
                            name="subject"
                            placeholder="How can we help?"
                            value={formData.subject}
                            onChange={handleChange}
                            className={errors.subject ? "border-destructive" : ""}
                          />
                          {errors.subject && (
                            <p className="text-sm text-destructive">{errors.subject}</p>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="message">Message *</Label>
                        <Textarea
                          id="message"
                          name="message"
                          placeholder="Tell us more about your inquiry..."
                          rows={5}
                          value={formData.message}
                          onChange={handleChange}
                          className={errors.message ? "border-destructive" : ""}
                        />
                        {errors.message && (
                          <p className="text-sm text-destructive">{errors.message}</p>
                        )}
                      </div>

                      <Button type="submit" size="lg" disabled={isSubmitting} className="w-full sm:w-auto">
                        {isSubmitting ? (
                          "Sending..."
                        ) : (
                          <>
                            <Send className="h-4 w-4 mr-2" />
                            Send Message
                          </>
                        )}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </div>
            </div>
          </section>
        </main>
        <Footer />
      </div>
    </>
  );
}
