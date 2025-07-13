-- Create function to notify backend about new thoughts
-- Note: This function will be called by the backend directly instead of using http_post
CREATE OR REPLACE FUNCTION notify_new_thought()
RETURNS TRIGGER AS $$
BEGIN
  -- For now, we'll just log that a new thought was created
  -- The actual notification will be sent by the backend when creating the thought
  RAISE NOTICE 'New thought created with ID: %', NEW.id;
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