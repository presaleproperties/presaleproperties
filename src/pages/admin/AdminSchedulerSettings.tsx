import { useState, useEffect } from "react";
import { AdminPage } from "@/components/admin/AdminPage";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Clock, Calendar, Settings } from "lucide-react";

interface AvailabilitySlot {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
}

interface SchedulerSettings {
  id: string;
  slot_duration_minutes: number;
  buffer_minutes: number;
  max_bookings_per_slot: number;
  advance_booking_days: number;
}

const DAYS = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
];

export default function AdminSchedulerSettings() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [availability, setAvailability] = useState<AvailabilitySlot[]>([]);
  const [settings, setSettings] = useState<SchedulerSettings | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [availabilityRes, settingsRes] = await Promise.all([
        supabase.from("scheduler_availability").select("*").order("day_of_week"),
        supabase.from("scheduler_settings").select("*").single(),
      ]);

      if (availabilityRes.data) setAvailability(availabilityRes.data);
      if (settingsRes.data) setSettings(settingsRes.data);
    } catch (error) {
      console.error("Error fetching scheduler data:", error);
      toast({
        title: "Error loading settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAvailabilityChange = (dayOfWeek: number, field: string, value: any) => {
    setAvailability((prev) =>
      prev.map((slot) =>
        slot.day_of_week === dayOfWeek ? { ...slot, [field]: value } : slot
      )
    );
  };

  const handleSettingsChange = (field: string, value: number) => {
    if (settings) {
      setSettings({ ...settings, [field]: value });
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Update availability
      for (const slot of availability) {
        const { error } = await supabase
          .from("scheduler_availability")
          .update({
            start_time: slot.start_time,
            end_time: slot.end_time,
            is_active: slot.is_active,
          })
          .eq("id", slot.id);

        if (error) throw error;
      }

      // Update settings
      if (settings) {
        const { error } = await supabase
          .from("scheduler_settings")
          .update({
            slot_duration_minutes: settings.slot_duration_minutes,
            buffer_minutes: settings.buffer_minutes,
            max_bookings_per_slot: settings.max_bookings_per_slot,
            advance_booking_days: settings.advance_booking_days,
          })
          .eq("id", settings.id);

        if (error) throw error;
      }

      toast({
        title: "Settings saved",
        description: "Scheduler settings have been updated.",
      });
    } catch (error) {
      console.error("Error saving settings:", error);
      toast({
        title: "Error saving settings",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Scheduler Settings</h1>
            <p className="text-muted-foreground">Configure booking availability and rules</p>
          </div>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Save Changes
          </Button>
        </div>

        {/* Weekly Availability */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Weekly Availability
            </CardTitle>
            <CardDescription>
              Set your available hours for each day of the week
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {DAYS.map((day) => {
                const slot = availability.find((s) => s.day_of_week === day.value);
                if (!slot) return null;

                return (
                  <div
                    key={day.value}
                    className="flex items-center gap-4 p-4 border rounded-lg"
                  >
                    <div className="w-28">
                      <Label className="font-medium">{day.label}</Label>
                    </div>
                    <Switch
                      checked={slot.is_active}
                      onCheckedChange={(checked) =>
                        handleAvailabilityChange(day.value, "is_active", checked)
                      }
                    />
                    {slot.is_active && (
                      <>
                        <div className="flex items-center gap-2">
                          <Input
                            type="time"
                            value={slot.start_time}
                            onChange={(e) =>
                              handleAvailabilityChange(day.value, "start_time", e.target.value)
                            }
                            className="w-32"
                          />
                          <span className="text-muted-foreground">to</span>
                          <Input
                            type="time"
                            value={slot.end_time}
                            onChange={(e) =>
                              handleAvailabilityChange(day.value, "end_time", e.target.value)
                            }
                            className="w-32"
                          />
                        </div>
                      </>
                    )}
                    {!slot.is_active && (
                      <span className="text-muted-foreground text-sm">Unavailable</span>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Booking Rules */}
        {settings && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Booking Rules
              </CardTitle>
              <CardDescription>
                Configure slot duration, buffers, and limits
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="slot_duration">Slot Duration (minutes)</Label>
                  <Input
                    id="slot_duration"
                    type="number"
                    min={15}
                    max={120}
                    step={15}
                    value={settings.slot_duration_minutes}
                    onChange={(e) =>
                      handleSettingsChange("slot_duration_minutes", parseInt(e.target.value) || 30)
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Length of each appointment slot
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="buffer">Buffer Time (minutes)</Label>
                  <Input
                    id="buffer"
                    type="number"
                    min={0}
                    max={60}
                    step={5}
                    value={settings.buffer_minutes}
                    onChange={(e) =>
                      handleSettingsChange("buffer_minutes", parseInt(e.target.value) || 0)
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Time between appointments
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="max_bookings">Max Bookings Per Slot</Label>
                  <Input
                    id="max_bookings"
                    type="number"
                    min={1}
                    max={10}
                    value={settings.max_bookings_per_slot}
                    onChange={(e) =>
                      handleSettingsChange("max_bookings_per_slot", parseInt(e.target.value) || 1)
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    How many bookings can share the same time slot
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="advance_days">Advance Booking Days</Label>
                  <Input
                    id="advance_days"
                    type="number"
                    min={7}
                    max={90}
                    value={settings.advance_booking_days}
                    onChange={(e) =>
                      handleSettingsChange("advance_booking_days", parseInt(e.target.value) || 30)
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    How far in advance users can book
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}
