import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Save, User } from "lucide-react";
import { toast } from "sonner";

const CITIES = [
  "Vancouver", "Surrey", "Burnaby", "Richmond", "Langley", "Coquitlam",
  "Delta", "Abbotsford", "New Westminster", "Port Coquitlam", "Port Moody",
  "Maple Ridge", "White Rock", "North Vancouver", "West Vancouver"
];

const PROPERTY_TYPES = ["condo", "townhome", "detached", "duplex"];

interface ClientData {
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  persona: string;
  status: string;
  preferred_cities: string[];
  preferred_property_types: string[];
  price_min: string;
  price_max: string;
  beds_min: string;
  alerts_enabled: boolean;
  alert_frequency: string;
  drip_enabled: boolean;
  notes: string;
  tags: string[];
}

export default function AdminClientForm() {
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();
  const isEditing = !!clientId && clientId !== "new";
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [tagInput, setTagInput] = useState("");
  
  const [client, setClient] = useState<ClientData>({
    email: "",
    first_name: "",
    last_name: "",
    phone: "",
    persona: "buyer",
    status: "active",
    preferred_cities: [],
    preferred_property_types: [],
    price_min: "",
    price_max: "",
    beds_min: "",
    alerts_enabled: true,
    alert_frequency: "daily",
    drip_enabled: true,
    notes: "",
    tags: [],
  });

  useEffect(() => {
    if (isEditing) {
      fetchClient();
    }
  }, [clientId]);

  const fetchClient = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("clients")
      .select("*")
      .eq("id", clientId)
      .single();

    if (error) {
      toast.error("Failed to load client");
      navigate("/admin/clients");
      return;
    }

    setClient({
      email: data.email || "",
      first_name: data.first_name || "",
      last_name: data.last_name || "",
      phone: data.phone || "",
      persona: data.persona || "buyer",
      status: data.status || "active",
      preferred_cities: data.preferred_cities || [],
      preferred_property_types: data.preferred_property_types || [],
      price_min: data.price_min?.toString() || "",
      price_max: data.price_max?.toString() || "",
      beds_min: data.beds_min?.toString() || "",
      alerts_enabled: data.alerts_enabled ?? true,
      alert_frequency: data.alert_frequency || "daily",
      drip_enabled: data.drip_enabled ?? true,
      notes: data.notes || "",
      tags: data.tags || [],
    });
    setLoading(false);
  };

  const handleSave = async () => {
    if (!client.email) {
      toast.error("Email is required");
      return;
    }

    setSaving(true);
    
    const clientData = {
      email: client.email,
      first_name: client.first_name || null,
      last_name: client.last_name || null,
      phone: client.phone || null,
      persona: client.persona,
      status: client.status,
      preferred_cities: client.preferred_cities.length > 0 ? client.preferred_cities : null,
      preferred_property_types: client.preferred_property_types.length > 0 ? client.preferred_property_types : null,
      price_min: client.price_min ? parseInt(client.price_min) : null,
      price_max: client.price_max ? parseInt(client.price_max) : null,
      beds_min: client.beds_min ? parseInt(client.beds_min) : null,
      alerts_enabled: client.alerts_enabled,
      alert_frequency: client.alert_frequency,
      drip_enabled: client.drip_enabled,
      notes: client.notes || null,
      tags: client.tags.length > 0 ? client.tags : null,
      source: "manual",
    };

    let error;
    if (isEditing) {
      ({ error } = await supabase.from("clients").update(clientData).eq("id", clientId));
    } else {
      ({ error } = await supabase.from("clients").insert(clientData));
    }

    setSaving(false);

    if (error) {
      if (error.code === "23505") {
        toast.error("A client with this email already exists");
      } else {
        toast.error("Failed to save client");
      }
      return;
    }

    toast.success(isEditing ? "Client updated" : "Client created");
    navigate("/admin/clients");
  };

  const toggleCity = (city: string) => {
    setClient(prev => ({
      ...prev,
      preferred_cities: prev.preferred_cities.includes(city)
        ? prev.preferred_cities.filter(c => c !== city)
        : [...prev.preferred_cities, city]
    }));
  };

  const togglePropertyType = (type: string) => {
    setClient(prev => ({
      ...prev,
      preferred_property_types: prev.preferred_property_types.includes(type)
        ? prev.preferred_property_types.filter(t => t !== type)
        : [...prev.preferred_property_types, type]
    }));
  };

  const addTag = () => {
    if (tagInput.trim() && !client.tags.includes(tagInput.trim())) {
      setClient(prev => ({ ...prev, tags: [...prev.tags, tagInput.trim()] }));
      setTagInput("");
    }
  };

  const removeTag = (tag: string) => {
    setClient(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tag) }));
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-20">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-3xl">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/admin/clients")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <User className="h-6 w-6" />
              {isEditing ? "Edit Client" : "Add Client"}
            </h1>
          </div>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Saving..." : "Save Client"}
          </Button>
        </div>

        {/* Contact Info */}
        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>First Name</Label>
                <Input
                  value={client.first_name}
                  onChange={(e) => setClient(prev => ({ ...prev, first_name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Last Name</Label>
                <Input
                  value={client.last_name}
                  onChange={(e) => setClient(prev => ({ ...prev, last_name: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Email *</Label>
              <Input
                type="email"
                value={client.email}
                onChange={(e) => setClient(prev => ({ ...prev, email: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input
                type="tel"
                value={client.phone}
                onChange={(e) => setClient(prev => ({ ...prev, phone: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Persona</Label>
                <Select value={client.persona} onValueChange={(v) => setClient(prev => ({ ...prev, persona: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="buyer">Buyer</SelectItem>
                    <SelectItem value="investor">Investor</SelectItem>
                    <SelectItem value="both">Both</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={client.status} onValueChange={(v) => setClient(prev => ({ ...prev, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="unsubscribed">Unsubscribed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Search Preferences */}
        <Card>
          <CardHeader>
            <CardTitle>Search Preferences</CardTitle>
            <CardDescription>Default criteria for property alerts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Preferred Cities</Label>
              <div className="flex flex-wrap gap-2">
                {CITIES.map((city) => (
                  <Badge
                    key={city}
                    variant={client.preferred_cities.includes(city) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => toggleCity(city)}
                  >
                    {city}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Property Types</Label>
              <div className="flex flex-wrap gap-2">
                {PROPERTY_TYPES.map((type) => (
                  <Badge
                    key={type}
                    variant={client.preferred_property_types.includes(type) ? "default" : "outline"}
                    className="cursor-pointer capitalize"
                    onClick={() => togglePropertyType(type)}
                  >
                    {type}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Min Price</Label>
                <Input
                  type="number"
                  value={client.price_min}
                  onChange={(e) => setClient(prev => ({ ...prev, price_min: e.target.value }))}
                  placeholder="500000"
                />
              </div>
              <div className="space-y-2">
                <Label>Max Price</Label>
                <Input
                  type="number"
                  value={client.price_max}
                  onChange={(e) => setClient(prev => ({ ...prev, price_max: e.target.value }))}
                  placeholder="1000000"
                />
              </div>
              <div className="space-y-2">
                <Label>Min Beds</Label>
                <Select value={client.beds_min} onValueChange={(v) => setClient(prev => ({ ...prev, beds_min: v }))}>
                  <SelectTrigger><SelectValue placeholder="Any" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Any</SelectItem>
                    <SelectItem value="1">1+</SelectItem>
                    <SelectItem value="2">2+</SelectItem>
                    <SelectItem value="3">3+</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Email Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Email Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Property Alerts</p>
                <p className="text-sm text-muted-foreground">Send emails when new properties match</p>
              </div>
              <Switch
                checked={client.alerts_enabled}
                onCheckedChange={(v) => setClient(prev => ({ ...prev, alerts_enabled: v }))}
              />
            </div>
            {client.alerts_enabled && (
              <div className="space-y-2">
                <Label>Alert Frequency</Label>
                <Select value={client.alert_frequency} onValueChange={(v) => setClient(prev => ({ ...prev, alert_frequency: v }))}>
                  <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="instant">Instant</SelectItem>
                    <SelectItem value="daily">Daily Digest</SelectItem>
                    <SelectItem value="weekly">Weekly Digest</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="flex items-center justify-between pt-4 border-t">
              <div>
                <p className="font-medium">Drip Campaign</p>
                <p className="text-sm text-muted-foreground">Automated nurture email sequence</p>
              </div>
              <Switch
                checked={client.drip_enabled}
                onCheckedChange={(v) => setClient(prev => ({ ...prev, drip_enabled: v }))}
              />
            </div>
          </CardContent>
        </Card>

        {/* Notes & Tags */}
        <Card>
          <CardHeader>
            <CardTitle>Notes & Tags</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Tags</Label>
              <div className="flex gap-2">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  placeholder="Add tag..."
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                />
                <Button type="button" variant="outline" onClick={addTag}>Add</Button>
              </div>
              {client.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {client.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="cursor-pointer" onClick={() => removeTag(tag)}>
                      {tag} ×
                    </Badge>
                  ))}
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={client.notes}
                onChange={(e) => setClient(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Internal notes about this client..."
                rows={4}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
