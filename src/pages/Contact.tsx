import { useState } from "react";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import { Helmet } from "@/components/seo/Helmet";
import { ConversionHeader } from "@/components/conversion/ConversionHeader";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { formatPhoneNumber } from "@/lib/formatPhone";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Mail, Phone, MapPin, Send, CheckCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";

const contactSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  email: z.string().trim().email("Invalid email address").max(255),
  phone: z.string().trim().min(10, "Please enter a valid phone number"),
  subject: z.string().trim().min(1, "Subject is required").max(200),
  message: z.string().trim().min(1, "Message is required").max(2000),
});

type ContactFormData = z.infer<typeof contactSchema>;

export default function Contact() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [honeypot, setHoneypot] = useState("");

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
    const formatted = name === "phone" ? formatPhoneNumber(value) : value;
    setFormData((prev) => ({ ...prev, [name]: formatted }));
    if (errors[name as keyof ContactFormData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (honeypot) return; // Bot detected
    setErrors({});

    const result = contactSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof ContactFormData, string>> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) fieldErrors[err.path[0] as keyof ContactFormData] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      const today = new Date().toISOString().split("T")[0];

      const { data: booking, error: bookingError } = await supabase.from("bookings").insert({
        name: result.data.name,
        email: result.data.email,
        phone: result.data.phone,
        notes: `Subject: ${result.data.subject}\n\n${result.data.message}`,
        project_name: result.data.subject,
        appointment_type: "showing" as const,
        buyer_type: "first_time" as const,
        timeline: "3_6_months" as const,
        appointment_date: today,
        appointment_time: "10:00",
        lead_source: "contact_page",
      }).select("id").single();

      if (bookingError) console.error("Error saving contact to DB:", bookingError);

      const { error: emailError } = await supabase.functions.invoke("send-contact-email", {
        body: { ...result.data },
      });
      if (emailError) console.error("Email send error:", emailError);

      if (booking?.id) {
        supabase.functions.invoke("send-booking-notification", {
          body: {
            booking_id: booking.id,
            appointment_type: "showing",
            appointment_date: today,
            appointment_time: "10:00",
            formattedDate: new Date().toLocaleDateString("en-CA", { weekday: "long", year: "numeric", month: "long", day: "numeric" }),
            formattedTime: "10:00 AM",
            project_name: result.data.subject,
            project_url: window.location.origin + "/contact",
            name: result.data.name,
            email: result.data.email,
            phone: result.data.phone,
            buyer_type: "first_time",
            timeline: "3_6_months",
            notes: result.data.message,
            lead_source: "contact_page",
          },
        }).catch(console.error);
      }

      setIsSubmitted(true);
      toast({ title: "Message sent!", description: "We'll get back to you as soon as possible." });
    } catch (error: any) {
      console.error("Error sending contact form:", error);
      toast({ title: "Error", description: error.message || "Failed to send message. Please try again.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "RealEstateAgent",
    "name": "PresaleProperties.com",
    "url": "https://presaleproperties.com",
    "telephone": "+1-672-258-1100",
    "email": "info@presaleproperties.com",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "3211 152 St, Building C, Suite 402",
      "addressLocality": "Surrey",
      "addressRegion": "BC",
      "postalCode": "V3Z 1H8",
      "addressCountry": "CA"
    },
    "areaServed": ["Vancouver", "Surrey", "Langley", "Coquitlam", "Burnaby", "Delta", "Abbotsford", "Richmond"]
  };

  if (isSubmitted) {
    return (
      <>
        <Helmet>
          <title>Message Sent | Presale Properties Vancouver</title>
          <meta name="description" content="Thank you for contacting Presale Properties. Our team will get back to you within 24-48 hours." />
        </Helmet>
        <div className="min-h-screen flex flex-col bg-background">
          <ConversionHeader />
          <main className="flex-1 container py-16">
            <div className="max-w-lg mx-auto text-center">
              <div className="mb-6 inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10">
                <CheckCircle className="h-8 w-8 text-primary" />
              </div>
              <h1 className="text-3xl font-bold mb-4">Thank You!</h1>
              <p className="text-muted-foreground mb-8">
                Your message has been received. Our team will review your inquiry and get back to you within 24–48 hours.
              </p>
              <Button onClick={() => { setIsSubmitted(false); setFormData({ name: "", email: "", phone: "", subject: "", message: "" }); }}>
                Send Another Message
              </Button>
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
        <title>Contact Us | Presale Properties Vancouver | Expert Guidance</title>
        <meta name="description" content="Get in touch with The Presale Properties Group. Book a free 15-minute consultation about presale condos and townhomes in Metro Vancouver." />
        <meta name="keywords" content="contact presale properties, Vancouver real estate, presale condos Vancouver, new construction BC" />
        <link rel="canonical" href="https://presaleproperties.com/contact" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Contact Us | Presale Properties Vancouver" />
        <meta property="og:description" content="Get in touch with Vancouver's new construction specialists for presale condos and move-in ready homes." />
        <meta property="og:url" content="https://presaleproperties.com/contact" />
        {/* Organization schema already in static index.html — no duplicate needed */}
      </Helmet>
      <div className="min-h-screen flex flex-col bg-background">
        <ConversionHeader />
        <main className="flex-1">
          <div className="border-b bg-muted/30">
            <div className="container py-3">
              <Breadcrumbs items={[{ label: "Contact" }]} />
            </div>
          </div>
          <section className="py-16 md:py-24 bg-gradient-to-b from-primary/5 to-background">
            <div className="container text-center">
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">Get in Touch</h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Have questions about presale projects? We're here to help.
              </p>
            </div>
          </section>

          <section className="py-8 sm:py-16">
            <div className="container px-4 sm:px-6">
              <div className="grid lg:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto">
                {/* Contact Info Cards */}
                <div className="space-y-4 sm:space-y-6">
                  <Card>
                    <CardContent className="flex items-start gap-4 p-6">
                      <div className="p-3 rounded-lg bg-primary/10">
                        <Mail className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold mb-1">Email Us</h3>
                        <a href="mailto:info@presaleproperties.com" className="text-muted-foreground hover:text-primary transition-colors">
                          info@presaleproperties.com
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
                        <a href="tel:+16722581100" className="text-muted-foreground hover:text-primary transition-colors">
                          (672) 258-1100
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
                        <p className="text-muted-foreground">3211 152 St, Building C, Suite 402<br />Surrey, BC V3Z 1H8</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Contact Form */}
                <Card className="lg:col-span-2">
                  <CardHeader className="p-4 sm:p-6">
                    <CardTitle className="text-lg sm:text-xl">Send Us a Message</CardTitle>
                    <CardDescription className="text-sm">
                      Fill out the form below and we'll get back to you as soon as possible.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
                    <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                      {/* Honeypot - hidden from real users */}
                      <input
                        type="text"
                        name="website_url"
                        value={honeypot}
                        onChange={(e) => setHoneypot(e.target.value)}
                        tabIndex={-1}
                        autoComplete="off"
                        aria-hidden="true"
                        style={{ position: "absolute", left: "-9999px", opacity: 0, height: 0, width: 0 }}
                      />
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="name" className="text-sm">Name *</Label>
                          <Input id="name" name="name" placeholder="Your name"
                            value={formData.name} onChange={handleChange}
                            className={`text-base ${errors.name ? "border-destructive" : ""}`} />
                          {errors.name && <p className="text-xs sm:text-sm text-destructive">{errors.name}</p>}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email" className="text-sm">Email *</Label>
                          <Input id="email" name="email" type="email" placeholder="your@email.com"
                            value={formData.email} onChange={handleChange} inputMode="email"
                            className={`text-base ${errors.email ? "border-destructive" : ""}`} />
                          {errors.email && <p className="text-xs sm:text-sm text-destructive">{errors.email}</p>}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="phone" className="text-sm">Phone *</Label>
                          <Input id="phone" name="phone" type="tel" inputMode="numeric" placeholder="(604) 555-0123"
                            value={formData.phone} onChange={handleChange}
                            className={`text-base text-[16px] ${errors.phone ? "border-destructive" : ""}`} />
                          {errors.phone && <p className="text-xs sm:text-sm text-destructive">{errors.phone}</p>}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="subject" className="text-sm">Subject *</Label>
                          <Input id="subject" name="subject" placeholder="How can we help?"
                            value={formData.subject} onChange={handleChange}
                            className={`text-base ${errors.subject ? "border-destructive" : ""}`} />
                          {errors.subject && <p className="text-xs sm:text-sm text-destructive">{errors.subject}</p>}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="message" className="text-sm">Message *</Label>
                        <Textarea id="message" name="message" placeholder="Tell us more about your inquiry..."
                          rows={4} value={formData.message} onChange={handleChange}
                          className={`text-base min-h-[100px] ${errors.message ? "border-destructive" : ""}`} />
                        {errors.message && <p className="text-xs sm:text-sm text-destructive">{errors.message}</p>}
                      </div>

                      <Button type="submit" size="lg" disabled={isSubmitting} className="w-full sm:w-auto h-12">
                        {isSubmitting ? (
                          <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Sending…</>
                        ) : (
                          <><Send className="h-4 w-4 mr-2" /> Send Message</>
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
