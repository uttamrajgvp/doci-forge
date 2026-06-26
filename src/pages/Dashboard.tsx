import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import {
  FileEdit,
  Layers,
  Combine,
  ArrowRight,
  Clock,
  Trash2,
  FileText,
  HardDrive,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useProjectStore, type Project } from '../stores/projectStore';
import { getAllProjects, deleteProject, getStorageUsage } from '../lib/db';
import { useToast } from '../components/ui/Toast';
import styles from './Dashboard.module.css';

const QUICK_ACTIONS = [
  {
    id: 'edit',
    icon: FileEdit,
    title: 'Edit PDF',
    desc: 'Upload and edit a single PDF with full formatting control.',
    route: '/editor',
    color: 'var(--color-primary)',
  },
  {
    id: 'bulk',
    icon: Layers,
    title: 'Bulk Generate',
    desc: 'Map CSV/Excel data to a PDF template and generate in bulk.',
    route: '/bulk',
    color: 'var(--color-success)',
  },
  {
    id: 'merge',
    icon: Combine,
    title: 'Merge & Split',
    desc: 'Combine multiple PDFs or extract page ranges.',
    route: '/merge',
    color: '#8B5CF6',
  },
];

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

export function Dashboard() {
  const navigate = useNavigate();
  const { projects, setProjects, removeProject } = useProjectStore();
  const { toast } = useToast();
  const [storage, setStorage] = useState({ used: 0, quota: 0 });

  useEffect(() => {
    getAllProjects().then((p) => setProjects(p.reverse()));
    getStorageUsage().then(setStorage);
  }, [setProjects]);

  const handleDelete = async (id: string, name: string) => {
    await deleteProject(id);
    removeProject(id);
    toast(`Deleted "${name}"`, 'success');
  };

  return (
    <div className={styles.dashboard}>
      {/* Quick Actions */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Quick Actions</h2>
        <div className={styles.actionGrid}>
          {QUICK_ACTIONS.map((action) => (
            <button
              key={action.id}
              className={styles.actionCard}
              onClick={() => navigate(action.route)}
            >
              <div
                className={styles.actionIcon}
                style={{ background: `${action.color}15`, color: action.color }}
              >
                <action.icon size={24} />
              </div>
              <div className={styles.actionBody}>
                <h3 className={styles.actionTitle}>{action.title}</h3>
                <p className={styles.actionDesc}>{action.desc}</p>
              </div>
              <ArrowRight size={18} className={styles.actionArrow} />
            </button>
          ))}
        </div>
      </section>

      {/* Recent Projects */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Recent Projects</h2>
          {storage.used > 0 && (
            <div className={styles.storageInfo}>
              <HardDrive size={14} />
              <span>{formatBytes(storage.used)} used</span>
            </div>
          )}
        </div>

        {projects.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>
              <FileText size={40} />
            </div>
            <h3 className={styles.emptyTitle}>No projects yet</h3>
            <p className={styles.emptyDesc}>
              Start by uploading a PDF or creating a bulk generation project.
            </p>
            <Button onClick={() => navigate('/editor')} icon={<FileEdit size={16} />}>
              Edit Your First PDF
            </Button>
          </div>
        ) : (
          <div className={styles.projectList}>
            {projects.map((project: Project) => (
              <div key={project.id} className={styles.projectRow}>
                <div className={styles.projectThumb}>
                  <FileText size={20} />
                </div>
                <div className={styles.projectInfo}>
                  <span className={styles.projectName}>{project.name}</span>
                  <span className={styles.projectMeta}>
                    <Clock size={12} />
                    {formatDate(project.updatedAt)}
                    {project.pageCount && ` · ${project.pageCount} pages`}
                    {project.fileSize && ` · ${formatBytes(project.fileSize)}`}
                  </span>
                </div>
                <div className={styles.projectType}>
                  {project.type === 'single' && <FileEdit size={14} />}
                  {project.type === 'bulk' && <Layers size={14} />}
                  {project.type === 'merge' && <Combine size={14} />}
                  <span>{project.type}</span>
                </div>
                <div className={styles.projectActions}>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate(`/editor?project=${project.id}`)}
                  >
                    Open
                  </Button>
                  <button
                    className={styles.deleteBtn}
                    onClick={() => handleDelete(project.id, project.name)}
                    aria-label={`Delete ${project.name}`}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
