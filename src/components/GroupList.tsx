import { Group } from '../App';
import { Folder, ChevronRight } from 'lucide-react';

interface GroupListProps {
  groups: Group[];
  onSelectGroup: (group: Group) => void;
}

export default function GroupList({ groups, onSelectGroup }: GroupListProps) {
  if (groups.length === 0) {
    return (
      <div className="text-center py-12">
        <Folder className="w-16 h-16 mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No groups yet</h3>
        <p className="text-gray-500">Create your first group to start organizing screenshots</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {groups.map((group) => (
        <button
          key={group.id}
          onClick={() => onSelectGroup(group)}
          className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow border border-gray-200 text-left group"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center mb-2">
                <Folder className="w-5 h-5 text-blue-600 mr-2" />
                <h3 className="text-lg font-medium text-gray-900">{group.name}</h3>
              </div>
              {group.description && (
                <p className="text-sm text-gray-500 line-clamp-2">{group.description}</p>
              )}
              <p className="text-xs text-gray-400 mt-2">
                {new Date(group.created_at).toLocaleDateString()}
              </p>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
          </div>
        </button>
      ))}
    </div>
  );
}
