import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function CreateFolderModal({ isOpen, onClose, onSubmit }) {
  const [folderName, setFolderName] = useState('');

  // Reset the input every time the modal opens
  useEffect(() => {
    if (isOpen) setFolderName('New Folder');
  }, [isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (folderName.trim()) {
      onSubmit(folderName.trim());
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Dark background overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-gray-900/40 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-md bg-white rounded-2xl shadow-xl pointer-events-auto overflow-hidden"
            >
              <form onSubmit={handleSubmit}>
                <div className="p-6">
                  <h2 className="text-xl font-semibold text-gray-800 mb-1">New folder</h2>
                  <p className="text-sm text-gray-500 mb-4">Enter a name for your new folder.</p>
                  
                  <input
                    type="text"
                    autoFocus
                    value={folderName}
                    onChange={(e) => setFolderName(e.target.value)}
                    className="w-full px-4 py-2 border border-blue-500 focus:ring-4 focus:ring-blue-100 rounded-xl outline-none transition-all"
                    placeholder="Folder name"
                  />
                </div>
                
                <div className="px-6 py-4 bg-gray-50 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!folderName.trim()}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
                  >
                    Create
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}