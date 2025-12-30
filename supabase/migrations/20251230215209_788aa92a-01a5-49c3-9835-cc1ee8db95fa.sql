-- Create booking status enum
CREATE TYPE public.booking_status AS ENUM ('pending', 'confirmed', 'cancelled', 'completed');

-- Create appointment type enum  
CREATE TYPE public.appointment_type AS ENUM ('preview', 'showing');

-- Create buyer type enum
CREATE TYPE public.buyer_type AS ENUM ('first_time', 'investor', 'upgrader', 'other');

-- Create timeline enum
CREATE TYPE public.buyer_timeline AS ENUM ('0_3_months', '3_6_months', '6_12_months', '12_plus_months');

-- Scheduler availability table (admin-defined weekly schedule)
CREATE TABLE public.scheduler_availability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  day_of_week integer NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0=Sunday, 6=Saturday
  start_time time NOT NULL,
  end_time time NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(day_of_week)
);

-- Blocked dates table (specific dates that are unavailable)
CREATE TABLE public.scheduler_blocked_dates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  blocked_date date NOT NULL UNIQUE,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Scheduler settings table
CREATE TABLE public.scheduler_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slot_duration_minutes integer NOT NULL DEFAULT 30,
  buffer_minutes integer NOT NULL DEFAULT 15,
  max_bookings_per_slot integer NOT NULL DEFAULT 1,
  advance_booking_days integer NOT NULL DEFAULT 30,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Insert default settings
INSERT INTO public.scheduler_settings (slot_duration_minutes, buffer_minutes, max_bookings_per_slot, advance_booking_days)
VALUES (30, 15, 1, 30);

-- Insert default availability (Mon-Fri 9am-5pm)
INSERT INTO public.scheduler_availability (day_of_week, start_time, end_time, is_active) VALUES
  (1, '09:00', '17:00', true), -- Monday
  (2, '09:00', '17:00', true), -- Tuesday
  (3, '09:00', '17:00', true), -- Wednesday
  (4, '09:00', '17:00', true), -- Thursday
  (5, '09:00', '17:00', true), -- Friday
  (0, '10:00', '16:00', false), -- Sunday (inactive)
  (6, '10:00', '16:00', false); -- Saturday (inactive)

-- Bookings table
CREATE TABLE public.bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Appointment details
  appointment_type appointment_type NOT NULL,
  appointment_date date NOT NULL,
  appointment_time time NOT NULL,
  status booking_status NOT NULL DEFAULT 'pending',
  
  -- Project context
  project_id uuid REFERENCES public.presale_projects(id) ON DELETE SET NULL,
  project_name text NOT NULL,
  project_url text,
  project_city text,
  project_neighborhood text,
  
  -- Contact info
  name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  
  -- Buyer profile
  buyer_type buyer_type NOT NULL,
  timeline buyer_timeline NOT NULL,
  notes text,
  
  -- Tracking
  lead_source text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  referrer text,
  
  -- Timestamps
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  confirmed_at timestamptz,
  cancelled_at timestamptz
);

-- Enable RLS
ALTER TABLE public.scheduler_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduler_blocked_dates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduler_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Scheduler availability policies
CREATE POLICY "Anyone can view active availability" ON public.scheduler_availability
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage availability" ON public.scheduler_availability
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Blocked dates policies
CREATE POLICY "Anyone can view blocked dates" ON public.scheduler_blocked_dates
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage blocked dates" ON public.scheduler_blocked_dates
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Scheduler settings policies  
CREATE POLICY "Anyone can view settings" ON public.scheduler_settings
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage settings" ON public.scheduler_settings
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Bookings policies
CREATE POLICY "Anyone can create bookings" ON public.bookings
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view all bookings" ON public.bookings
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage bookings" ON public.bookings
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Create indexes for performance
CREATE INDEX idx_bookings_date ON public.bookings(appointment_date);
CREATE INDEX idx_bookings_status ON public.bookings(status);
CREATE INDEX idx_bookings_project ON public.bookings(project_id);

-- Update trigger for bookings
CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Update trigger for scheduler_availability
CREATE TRIGGER update_scheduler_availability_updated_at
  BEFORE UPDATE ON public.scheduler_availability
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();