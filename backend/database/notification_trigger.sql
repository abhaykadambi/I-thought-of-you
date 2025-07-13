-- Enable the http extension for webhooks
CREATE EXTENSION IF NOT EXISTS "http" WITH SCHEMA "extensions";

-- Create function to notify backend about new thoughts
CREATE OR REPLACE FUNCTION notify_new_thought()
RETURNS TRIGGER AS $$
BEGIN
  -- Call the webhook endpoint
  PERFORM http_post(
    url := 'https://i-thought-of-you-production.up.railway.app/api/notifications/webhook/new-thought',
    body := json_build_object('thought_id', NEW.id),
    headers := '{"Content-Type": "application/json"}'::json
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to call the function when a new thought is inserted
DROP TRIGGER IF EXISTS thought_created ON thoughts;
CREATE TRIGGER thought_created
  AFTER INSERT ON thoughts
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_thought();

-- Note: Replace 'https://your-backend-url.com' with your actual backend URL
-- For local development, you might need to use a service like ngrok to expose your local server 