/*
  # Create Groups and Images Tables

  ## Overview
  This migration creates the core database structure for the Screenshot Organizer app,
  which allows users to organize screenshots into groups with AI-powered categorization.

  ## New Tables
  
  ### `groups`
  Stores user-created groups for organizing screenshots.
  - `id` (uuid, primary key): Unique identifier for each group
  - `name` (text): Name of the group
  - `description` (text, nullable): Optional description of the group
  - `created_at` (timestamptz): Timestamp when the group was created
  - `updated_at` (timestamptz): Timestamp when the group was last updated

  ### `images`
  Stores screenshot metadata and categorization results.
  - `id` (uuid, primary key): Unique identifier for each image
  - `group_id` (uuid, foreign key): Reference to the parent group
  - `file_path` (text): Storage path for the image file
  - `file_name` (text): Original filename of the uploaded image
  - `category` (text, nullable): AI-assigned category (e.g., 'UI Design', 'Typography')
  - `created_at` (timestamptz): Timestamp when the image was uploaded

  ## Security
  
  ### Row Level Security (RLS)
  Both tables have RLS enabled with public access policies for the initial version.
  In a production environment, these should be restricted to authenticated users.

  ### Policies
  - Groups: Public read and write access
  - Images: Public read and write access

  ## Notes
  - Foreign key constraint ensures referential integrity between images and groups
  - CASCADE delete ensures images are removed when their parent group is deleted
  - Indexes on foreign keys for optimal query performance
*/

-- Create groups table
CREATE TABLE IF NOT EXISTS groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create images table
CREATE TABLE IF NOT EXISTS images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  file_path text NOT NULL,
  file_name text NOT NULL,
  category text,
  created_at timestamptz DEFAULT now()
);

-- Create index on foreign key for better query performance
CREATE INDEX IF NOT EXISTS idx_images_group_id ON images(group_id);

-- Enable Row Level Security
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE images ENABLE ROW LEVEL SECURITY;

-- Create policies for groups table
CREATE POLICY "Allow public read access to groups"
  ON groups
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public insert access to groups"
  ON groups
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public update access to groups"
  ON groups
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete access to groups"
  ON groups
  FOR DELETE
  TO public
  USING (true);

-- Create policies for images table
CREATE POLICY "Allow public read access to images"
  ON images
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public insert access to images"
  ON images
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public update access to images"
  ON images
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete access to images"
  ON images
  FOR DELETE
  TO public
  USING (true);
