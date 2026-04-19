import { motion } from 'framer-motion';

interface SyncStatusProps {
  status: 'connected' | 'syncing' | 'disconnected';
  showLabel?: boolean;
}

export function SyncStatus({ status, showLabel = false }: SyncStatusProps) {
  const statusConfig = {
    connected: { color: '#22C55E', label: 'Synced' },
    syncing: { color: '#EAB308', label: 'Syncing' },
    disconnected: { color: '#EF4444', label: 'Offline' },
  };

  const config = statusConfig[status];

  return (
    <div className="flex items-center gap-2">
      <motion.div
        animate={status === 'syncing' ? { scale: [1, 1.2, 1] } : {}}
        transition={{ repeat: status === 'syncing' ? Infinity : 0, duration: 1 }}
        className="w-2 h-2 rounded-full"
        style={{ backgroundColor: config.color }}
      />
      {showLabel && (
        <span className="text-xs text-cipher-muted font-mono">{config.label}</span>
      )}
    </div>
  );
}

export default SyncStatus;