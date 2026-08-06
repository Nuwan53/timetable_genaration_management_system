import { BookOpen, Users, MapPin, GraduationCap, UsersRound, Clock, Plus } from 'lucide-react';

const emptyStateConfig = {
  'Courses': {
    icon: BookOpen,
    heading: 'No courses found',
    description: 'Add your first course to get started.',
    actionLabel: 'Add Course',
  },
  'Lecturers': {
    icon: Users,
    heading: 'No lecturers found',
    description: 'Add your first lecturer to get started.',
    actionLabel: 'Add Lecturer',
  },
  'Venues': {
    icon: MapPin,
    heading: 'No venues found',
    description: 'Add your first venue to get started.',
    actionLabel: 'Add Venue',
  },
  'Students': {
    icon: GraduationCap,
    heading: 'No students found',
    description: 'Add your first student to get started.',
    actionLabel: 'Add Student',
  },
  'Student Groups': {
    icon: UsersRound,
    heading: 'No student groups found',
    description: 'Create your first student group to continue.',
    actionLabel: 'Add Student Group',
  },
  'Time Slots': {
    icon: Clock,
    heading: 'No time slots found',
    description: 'Create your first time slot to continue.',
    actionLabel: 'Add Time Slot',
  }
};

export default function EmptyState({ title, onAction }) {
  const config = emptyStateConfig[title] || {
    icon: Plus,
    heading: `No ${title.toLowerCase()} found`,
    description: `Add your first ${title.toLowerCase()} to get started.`,
    actionLabel: `Add ${title}`,
  };

  const Icon = config.icon;

  return (
    <div className="empty-state" role="status" aria-live="polite">
      <div className="empty-state-icon">
        <Icon size={28} strokeWidth={1.5} />
      </div>
      <h3 className="empty-state-title">{config.heading}</h3>
      <p className="empty-state-description">{config.description}</p>
      <button type="button" className="btn btn-primary" onClick={onAction}>
        <Plus size={16} />
        {config.actionLabel}
      </button>
    </div>
  );
}
