import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import GroupList from './components/GroupList';
import GroupView from './components/GroupView';
import CreateGroupModal from './components/CreateGroupModal';
import { Plus } from 'lucide-react';

export interface Group {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

function App() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGroups();
  }, []);

  async function loadGroups() {
    try {
      const { data, error } = await supabase
        .from('groups')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setGroups(data || []);
    } catch (error) {
      console.error('Error loading groups:', error);
    } finally {
      setLoading(false);
    }
  }

  async function createGroup(name: string, description: string) {
    try {
      const { data, error } = await supabase
        .from('groups')
        .insert([{ name, description }])
        .select()
        .single();

      if (error) throw error;
      if (data) {
        setGroups([data, ...groups]);
        setShowCreateModal(false);
      }
    } catch (error) {
      console.error('Error creating group:', error);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <h1 className="text-lg sm:text-2xl font-semibold text-gray-900">Screenshot Organizer</h1>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center px-3 py-2 sm:px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base"
            >
              <Plus className="w-4 h-4 sm:w-5 sm:h-5 sm:mr-2" />
              <span className="hidden sm:inline">New Group</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-500">Loading...</div>
          </div>
        ) : selectedGroup ? (
          <GroupView
            group={selectedGroup}
            onBack={() => setSelectedGroup(null)}
            onGroupUpdate={loadGroups}
          />
        ) : (
          <GroupList
            groups={groups}
            onSelectGroup={setSelectedGroup}
          />
        )}
      </main>

      {showCreateModal && (
        <CreateGroupModal
          onClose={() => setShowCreateModal(false)}
          onCreate={createGroup}
        />
      )}
    </div>
  );
}

export default App;
