# Database Setup for Messages Feature

## Overview
This feature adds a custom contact/report form that stores messages in a Supabase database instead of using external email clients.

## Database Table
The `messages` table stores both contact us messages and problem reports with the following structure:

- `id`: UUID primary key
- `user_id`: References the authenticated user
- `type`: Either 'contact' or 'report'
- `subject`: Subject line of the message
- `message`: The message content
- `created_at`: Timestamp when message was created
- `updated_at`: Timestamp when message was last updated

## Setup Instructions

1. **Create the table in Supabase:**
   - Go to your Supabase project dashboard
   - Navigate to the SQL Editor
   - Copy and paste the contents of `messages_table.sql`
   - Run the SQL to create the table with proper RLS policies

2. **Verify the setup:**
   - Check that the `messages` table appears in your database
   - Verify that RLS is enabled
   - Test that the policies work correctly

## Features

- **Secure**: Uses Row Level Security (RLS) so users can only see their own messages
- **Type differentiation**: Distinguishes between 'contact' and 'report' messages
- **User-friendly**: Custom modal interface matching your app's design
- **Database-driven**: All messages stored in your Supabase database for easy management

## Usage

Users can now:
- Submit contact messages through "Contact Us"
- Report problems through "Report a Problem"
- Both use the same unified interface with different messaging
- All submissions are stored securely in your database
