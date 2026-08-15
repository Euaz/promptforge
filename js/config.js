/* Cloud sync configuration.
   The anon key is designed to be published in client-side code — row-level
   security in supabase-setup.sql is what actually protects the data.
   Never put the service_role key in this file.
   Blank these out to run the app in local-only mode. */

window.PF_CONFIG = {
  supabaseUrl: 'https://zdtgrdocberuovqiziiq.supabase.co',
  supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkdGdyZG9jYmVydW92cWl6aWlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYzNTQwNjIsImV4cCI6MjEwMTkzMDA2Mn0.jGzCFkzkAca3wfq5E3n1nNb5Tnhbd0tHNEwK9okLdfQ'
};
