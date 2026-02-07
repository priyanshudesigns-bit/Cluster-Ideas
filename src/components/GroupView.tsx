import { useState, useEffect } from 'react';
import { Group } from '../App';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Upload, Download } from 'lucide-react';
import ImageGrid from './ImageGrid';
import CategoryFilter from './CategoryFilter';
import FigmaExportModal from './FigmaExportModal';

interface ImageData {
  id: string;
  group_id: string;
  file_path: string;
  file_name: string;
  category: string | null;
  created_at: string;
}

interface GroupViewProps {
  group: Group;
  onBack: () => void;
  onGroupUpdate?: () => void;
}

export default function GroupView({ group, onBack }: GroupViewProps) {
  const [images, setImages] = useState<ImageData[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showFigmaModal, setShowFigmaModal] = useState(false);

  useEffect(() => {
    loadImages();
  }, [group.id]);

  async function loadImages() {
    try {
      const { data, error } = await supabase
        .from('images')
        .select('*')
        .eq('group_id', group.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setImages(data || []);
    } catch (error) {
      console.error('Error loading images:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `${group.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('screenshots')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { error: insertError } = await supabase
          .from('images')
          .insert([{
            group_id: group.id,
            file_path: filePath,
            file_name: file.name,
          }]);

        if (insertError) throw insertError;
      }

      await loadImages();
      await categorizeImages();
    } catch (error) {
      console.error('Error uploading files:', error);
    } finally {
      setUploading(false);
    }
  }

  async function categorizeImages() {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/categorize-images`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ groupId: group.id }),
        }
      );

      if (!response.ok) throw new Error('Categorization failed');
      await loadImages();
    } catch (error) {
      console.error('Error categorizing images:', error);
    }
  }

  function exportToFigma() {
    if (images.length === 0) {
      alert('Please upload some images before exporting to Figma.');
      return;
    }
    setShowFigmaModal(true);
  }

  const filteredImages = selectedCategory === 'all'
    ? images
    : images.filter(img => img.category === selectedCategory);

  const categories = ['all', ...new Set(images.map(img => img.category).filter(Boolean))];

  return (
    <div>
      <div className="mb-6">
        <button
          onClick={onBack}
          className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Groups
        </button>

        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex-1">
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-900">{group.name}</h2>
            {group.description && (
              <p className="text-gray-500 mt-1 text-sm sm:text-base">{group.description}</p>
            )}
          </div>

          <div className="flex gap-2 flex-shrink-0">
            <label className="inline-flex items-center px-3 py-2 sm:px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer text-sm sm:text-base">
              <Upload className="w-4 h-4 sm:w-5 sm:h-5 sm:mr-2" />
              <span className="hidden sm:inline">{uploading ? 'Uploading...' : 'Upload'}</span>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
                disabled={uploading}
              />
            </label>

            <button
              onClick={exportToFigma}
              className="inline-flex items-center px-3 py-2 sm:px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm sm:text-base"
            >
              <Download className="w-4 h-4 sm:w-5 sm:h-5 sm:mr-2" />
              <span className="hidden sm:inline">Export to Figma</span>
            </button>
          </div>
        </div>
      </div>

      <CategoryFilter
        categories={categories as string[]}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
      />

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading images...</div>
        </div>
      ) : (
        <ImageGrid images={filteredImages} />
      )}

      {showFigmaModal && (
        <FigmaExportModal
          groupId={group.id}
          groupName={group.name}
          onClose={() => setShowFigmaModal(false)}
        />
      )}
    </div>
  );
}
