-- Migration: Seed courts table with sample data for development/testing
-- This provides initial courts in major cities for testing the app

-- Insert sample courts in Atlanta (default location)
insert into public.courts (id, name, description, latitude, longitude, address, city, state, postal_code, country, timezone, indoor, surface_type, num_hoops, lighting, open_24h, hours_json, amenities_json, photos_count)
values
  ('atlanta-1', 'Piedmont Park Courts', 'Popular outdoor courts with great views', 33.7879, -84.3725, 'Piedmont Ave NE', 'Atlanta', 'GA', '30309', 'US', 'America/New_York', false, 'asphalt', 4, true, false, '{"open": "06:00", "close": "22:00"}'::jsonb, '["parking", "restrooms", "water"]'::jsonb, 2),
  ('atlanta-2', 'Washington Park', 'Community courts with regular pickup games', 33.7367, -84.4129, '14 Ollie St NW', 'Atlanta', 'GA', '30314', 'US', 'America/New_York', false, 'concrete', 6, true, false, '{"open": "06:00", "close": "23:00"}'::jsonb, '["lights", "parking"]'::jsonb, 3),
  ('atlanta-3', 'Skyline Park', 'Indoor court downtown', 33.7588, -84.3903, '705 Peachtree St NE', 'Atlanta', 'GA', '30308', 'US', 'America/New_York', true, 'hardwood', 2, true, false, '{"open": "08:00", "close": "20:00"}'::jsonb, '["indoor", "restrooms", "parking"]'::jsonb, 5);

-- Insert sample courts in San Francisco
insert into public.courts (id, name, description, latitude, longitude, address, city, state, postal_code, country, timezone, indoor, surface_type, num_hoops, lighting, open_24h, hours_json, amenities_json, photos_count)
values
  ('sf-1', 'Mission Playground', 'Neighborhood courts with pickup games most evenings', 37.7596, -122.4148, '2450 Harrison St', 'San Francisco', 'CA', '94110', 'US', 'America/Los_Angeles', false, 'asphalt', 4, true, false, '{"open": "06:00", "close": "22:00"}'::jsonb, '["lights", "restrooms"]'::jsonb, 3),
  ('sf-2', 'Dolores Park Court', 'Popular outdoor courts near the park', 37.7598, -122.4269, 'Dolores St & 19th St', 'San Francisco', 'CA', '94114', 'US', 'America/Los_Angeles', false, 'concrete', 2, false, false, '{"open": "sunrise", "close": "sunset"}'::jsonb, '["water"]'::jsonb, 2),
  ('sf-3', 'Panhandle Courts', 'Larger run with multiple hoops', 37.7716, -122.4481, 'Fell St & Stanyan St', 'San Francisco', 'CA', '94117', 'US', 'America/Los_Angeles', false, 'asphalt', 6, true, false, '{"open": "06:00", "close": "23:00"}'::jsonb, '["lights", "parking"]'::jsonb, 5);

-- Insert sample courts in New York
insert into public.courts (id, name, description, latitude, longitude, address, city, state, postal_code, country, timezone, indoor, surface_type, num_hoops, lighting, open_24h, hours_json, amenities_json, photos_count)
values
  ('nyc-1', 'Rucker Park', 'Legendary Harlem court with rich basketball history', 40.8303, -73.9363, '155th St & Frederick Douglass Blvd', 'New York', 'NY', '10039', 'US', 'America/New_York', false, 'asphalt', 4, true, false, '{"open": "06:00", "close": "22:00"}'::jsonb, '["lights", "bleachers"]'::jsonb, 10),
  ('nyc-2', 'West 4th Street Courts', 'The Cage - iconic NYC street basketball venue', 40.7325, -74.0007, 'W 4th St & 6th Ave', 'New York', 'NY', '10012', 'US', 'America/New_York', false, 'asphalt', 2, true, false, '{"open": "06:00", "close": "23:00"}'::jsonb, '["fencing", "bleachers"]'::jsonb, 8),
  ('nyc-3', 'Chelsea Recreation Center', 'Indoor courts with great facilities', 40.7459, -74.0014, '430 W 25th St', 'New York', 'NY', '10001', 'US', 'America/New_York', true, 'hardwood', 2, true, false, '{"open": "07:00", "close": "21:00"}'::jsonb, '["indoor", "restrooms", "lockers"]'::jsonb, 4);

-- Insert sample courts in Los Angeles
insert into public.courts (id, name, description, latitude, longitude, address, city, state, postal_code, country, timezone, indoor, surface_type, num_hoops, lighting, open_24h, hours_json, amenities_json, photos_count)
values
  ('la-1', 'Venice Beach Courts', 'Famous beachside courts with ocean views', 33.9850, -118.4695, 'Ocean Front Walk', 'Los Angeles', 'CA', '90291', 'US', 'America/Los_Angeles', false, 'asphalt', 6, true, true, null, '["lights", "beach", "parking"]'::jsonb, 15),
  ('la-2', 'Pan Pacific Park', 'Well-maintained community courts', 34.0756, -118.3450, '7600 Beverly Blvd', 'Los Angeles', 'CA', '90036', 'US', 'America/Los_Angeles', false, 'concrete', 4, true, false, '{"open": "06:00", "close": "22:00"}'::jsonb, '["lights", "restrooms", "parking"]'::jsonb, 6),
  ('la-3', 'Rancho Cienega Recreation Center', 'Indoor/outdoor complex with multiple courts', 34.0383, -118.3406, '5001 Rodeo Rd', 'Los Angeles', 'CA', '90016', 'US', 'America/Los_Angeles', true, 'hardwood', 4, true, false, '{"open": "08:00", "close": "20:00"}'::jsonb, '["indoor", "outdoor", "restrooms", "parking"]'::jsonb, 7);

-- Insert sample courts in Chicago
insert into public.courts (id, name, description, latitude, longitude, address, city, state, postal_code, country, timezone, indoor, surface_type, num_hoops, lighting, open_24h, hours_json, amenities_json, photos_count)
values
  ('chi-1', 'Malcolm X College Court', 'Popular West Side courts', 41.8753, -87.6738, '1900 W Van Buren St', 'Chicago', 'IL', '60612', 'US', 'America/Chicago', false, 'asphalt', 4, true, false, '{"open": "06:00", "close": "22:00"}'::jsonb, '["lights", "parking"]'::jsonb, 4),
  ('chi-2', 'Seward Park', 'North Side courts with great community', 41.9097, -87.6615, '375 W Elm St', 'Chicago', 'IL', '60610', 'US', 'America/Chicago', false, 'concrete', 2, false, false, '{"open": "06:00", "close": "20:00"}'::jsonb, '["parking"]'::jsonb, 2),
  ('chi-3', 'UIC Recreation Center', 'Indoor university courts', 41.8708, -87.6479, '828 S Wolcott Ave', 'Chicago', 'IL', '60612', 'US', 'America/Chicago', true, 'hardwood', 2, true, false, '{"open": "07:00", "close": "21:00"}'::jsonb, '["indoor", "restrooms", "lockers"]'::jsonb, 3);

-- Note: The location geography is automatically populated by the trigger
-- based on latitude and longitude values
