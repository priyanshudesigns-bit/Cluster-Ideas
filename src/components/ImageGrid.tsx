import { supabase } from '../lib/supabase';
import { Image as ImageIcon } from 'lucide-react';

interface ImageData {
  id: string;
  group_id: string;
  file_path: string;
  file_name: string;
  category: string | null;
  created_at: string;
}

interface ImageGridProps {
  images: ImageData[];
}

export default function ImageGrid({ images }: ImageGridProps) {
  function getImageUrl(filePath: string) {
    const { data } = supabase.storage
      .from('screenshots')
      .getPublicUrl(filePath);
    return data.publicUrl;
  }

  if (images.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-300">
        <ImageIcon className="w-16 h-16 mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No images yet</h3>
        <p className="text-gray-500">Upload screenshots to get started</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {images.map((image) => (
        <div
          key={image.id}
          className="group relative bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow border border-gray-200"
        >
          <div className="aspect-square">
            <img
              src={getImageUrl(image.file_path)}
              alt={image.file_name}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="p-3">
            <p className="text-sm font-medium text-gray-900 truncate">{image.file_name}</p>
            {image.category && (
              <span className="inline-block mt-1 px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded">
                {image.category}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
