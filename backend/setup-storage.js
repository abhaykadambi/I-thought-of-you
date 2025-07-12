const supabase = require('./config/supabase');

async function setupStorage() {
  try {
    console.log('Setting up Supabase storage...');
    
    // Create the storage bucket if it doesn't exist
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('Error listing buckets:', listError);
      return;
    }
    
    const bucketExists = buckets.some(bucket => bucket.name === 'thought-images');
    
    if (!bucketExists) {
      console.log('Creating thought-images bucket...');
      const { data, error } = await supabase.storage.createBucket('thought-images', {
        public: true,
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif'],
        fileSizeLimit: 5242880 // 5MB
      });
      
      if (error) {
        console.error('Error creating bucket:', error);
        return;
      }
      
      console.log('✅ Storage bucket created successfully');
    } else {
      console.log('✅ Storage bucket already exists');
    }
    
    console.log('Storage setup complete!');
    
  } catch (error) {
    console.error('Storage setup error:', error);
  }
}

setupStorage(); 